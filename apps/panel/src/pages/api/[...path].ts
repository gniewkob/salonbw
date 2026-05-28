import type { NextApiRequest, NextApiResponse } from 'next';

const BACKEND_URL = process.env.API_PROXY_URL || 'https://api.salon-bw.pl';

// Local API routes that should NOT be proxied to backend
const LOCAL_ROUTES = new Set(['calendar-embed', 'runtime', 'gallery', '_diag']);

export function normalizeCompatStatus(
    _targetPath: string,
    status: number,
): number {
    // No-op since the vendored Versum calendar embed at /api/calendar-embed
    // was removed; the only consumer of the 201→200 GraphQL hack is gone.
    // The function is kept (rather than inlined) so callers don't have to
    // change and the test contract stays stable.
    return status;
}

export function buildTargetUrl(
    baseUrl: string,
    pathSegments: string[],
    query: NextApiRequest['query'],
): string {
    const targetPath = '/' + pathSegments.join('/');
    const params = new URLSearchParams();

    for (const [key, value] of Object.entries(query)) {
        if (key === 'path' || value === undefined) continue;
        if (Array.isArray(value)) {
            for (const entry of value) {
                params.append(key, entry);
            }
            continue;
        }
        params.append(key, value);
    }

    const queryString = params.toString();
    return `${baseUrl}${targetPath}${queryString ? `?${queryString}` : ''}`;
}

/**
 * Catch-all API proxy that forwards requests to the backend
 * with the Authorization header extracted from the accessToken cookie.
 */
export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    const { path } = req.query;
    const pathSegments = (Array.isArray(path) ? path : [path]).filter(
        (segment): segment is string =>
            typeof segment === 'string' && segment.length > 0,
    );

    if (pathSegments.length === 0) {
        res.status(400).json({ error: 'Missing proxy path' });
        return;
    }

    // Don't proxy local routes - let Next.js handle them
    const firstSegment = pathSegments[0];
    if (
        pathSegments.length === 1 &&
        firstSegment &&
        LOCAL_ROUTES.has(firstSegment)
    ) {
        res.status(404).json({ error: 'Not found - use direct route' });
        return;
    }
    const targetPath = '/' + pathSegments.join('/');
    const accessToken = req.cookies.accessToken;
    const method = (req.method || 'GET').toUpperCase();
    const isBodyAllowed = method !== 'GET' && method !== 'HEAD';

    // Build upstream headers from incoming request, excluding hop-by-hop and host headers.
    const headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.headers)) {
        if (!value) continue;
        const k = key.toLowerCase();
        if (
            k === 'host' ||
            // Do not forward browser Origin/Referer through the server-side proxy.
            // The backend has strict CORS origin validation and will return 500
            // on disallowed origins (e.g. http vs https). The proxy itself is the
            // trust boundary, so omit these to avoid false CORS rejections.
            k === 'origin' ||
            k === 'referer' ||
            k === 'connection' ||
            // Let node/fetch compute these as needed.
            k === 'content-length' ||
            k === 'accept-encoding'
        ) {
            continue;
        }
        headers[key] = Array.isArray(value) ? value.join(', ') : value;
    }

    // Ensure bearer header is present when access token exists.
    if (accessToken && !headers.Authorization && !headers.authorization) {
        headers['Authorization'] = `Bearer ${accessToken}`;
    }

    // For the client-log ingest endpoint, attach the shared CLIENT_LOG_TOKEN
    // server-side so it never has to land in the JS bundle as a public env
    // var. If the env is unset, the proxy forwards without the header and
    // the backend will accept the request iff its CLIENT_LOG_TOKEN is also
    // unset (no token, no check).
    if (targetPath === '/logs/client') {
        const logToken = process.env.CLIENT_LOG_TOKEN;
        if (logToken && !headers['x-log-token']) {
            headers['x-log-token'] = logToken;
        }
    }

    let body: Uint8Array | undefined;
    if (isBodyAllowed) {
        try {
            body = await readRawBody(req);
        } catch (err) {
            const code = (err as NodeJS.ErrnoException).code;
            if (code === 'BODY_TOO_LARGE') {
                res.status(413).json({ error: 'Request body too large' });
                return;
            }
            throw err;
        }
    }

    // Some upstream stacks (Passenger/proxies) can be sensitive to chunked uploads.
    // When we buffer the full request body, we can safely set Content-Length.
    if (body && !headers['Content-Length'] && !headers['content-length']) {
        headers['Content-Length'] = String(body.byteLength);
    }

    const targetUrl = buildTargetUrl(BACKEND_URL, pathSegments, req.query);

    try {
        const backendRes = await fetch(targetUrl, {
            method,
            headers,
            body: body as unknown as RequestInit['body'],
        });

        // Forward response status and selected headers.
        // For file downloads/uploads we must preserve binary response bodies
        // and important headers like Content-Disposition.
        res.status(normalizeCompatStatus(targetPath, backendRes.status));

        const passthroughHeaders = [
            'content-type',
            'content-disposition',
            'cache-control',
            'x-request-id',
        ];
        for (const name of passthroughHeaders) {
            const v = backendRes.headers.get(name);
            if (v) res.setHeader(name, v);
        }

        const setCookie = (
            backendRes.headers as unknown as {
                getSetCookie?: () => string[];
            }
        ).getSetCookie?.();
        if (setCookie && setCookie.length > 0) {
            res.setHeader('Set-Cookie', setCookie);
        } else {
            const singleSetCookie = backendRes.headers.get('set-cookie');
            if (singleSetCookie) {
                res.setHeader('Set-Cookie', singleSetCookie);
            }
        }

        // Return response body (binary-safe).
        const ab = await backendRes.arrayBuffer();
        res.send(Buffer.from(ab));
    } catch (error) {
        console.error('API proxy error:', error);
        res.status(502).json({ error: 'Bad Gateway' });
    }
}

export const config = {
    api: {
        // Critical: disable Next body parsing to keep request bodies intact
        // (multipart, binary downloads, etc). We forward raw bytes to the backend.
        bodyParser: false,
    },
};

const MAX_BODY_BYTES = 10 * 1024 * 1024; // 10 MB

function readRawBody(req: NextApiRequest): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        let totalBytes = 0;
        req.on('data', (chunk: Buffer) => {
            totalBytes += chunk.byteLength;
            if (totalBytes > MAX_BODY_BYTES) {
                req.destroy();
                reject(
                    Object.assign(new Error('Request body too large'), {
                        code: 'BODY_TOO_LARGE',
                    }),
                );
                return;
            }
            chunks.push(chunk);
        });
        req.on('end', () => resolve(Buffer.concat(chunks)));
        req.on('error', reject);
    });
}
