import type { NextApiRequest, NextApiResponse } from 'next';

const BACKEND_URL = process.env.API_PROXY_URL || 'https://api.salon-bw.pl';

// Local API routes that should NOT be proxied to backend
const LOCAL_ROUTES = new Set(['calendar-embed', 'runtime', 'gallery', '_diag']);

/**
 * Catch-all API proxy that forwards requests to the backend
 * with the Authorization header extracted from the accessToken cookie.
 */
export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    const { path } = req.query;
    const pathSegments = Array.isArray(path) ? path : [path];

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

    const body: Uint8Array | undefined = isBodyAllowed
        ? await readRawBody(req)
        : undefined;

    const targetUrl = `${BACKEND_URL}${targetPath}`;

    try {
        const backendRes = await fetch(targetUrl, {
            method,
            headers,
            body: body as unknown as RequestInit['body'],
        });

        // Forward response status and selected headers.
        // For file downloads/uploads we must preserve binary response bodies
        // and important headers like Content-Disposition.
        res.status(backendRes.status);

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

function readRawBody(req: NextApiRequest): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        req.on('data', (chunk: Buffer) => {
            chunks.push(chunk);
        });
        req.on('end', () => resolve(Buffer.concat(chunks)));
        req.on('error', reject);
    });
}
