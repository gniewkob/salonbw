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
            k === 'connection' ||
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

    let body: string | undefined;
    if (isBodyAllowed && req.body !== undefined) {
        if (typeof req.body === 'string') {
            body = req.body;
        } else if (Buffer.isBuffer(req.body)) {
            body = req.body.toString();
        } else {
            body = JSON.stringify(req.body);
            if (!headers['Content-Type'] && !headers['content-type']) {
                headers['Content-Type'] = 'application/json';
            }
        }
    }

    const targetUrl = `${BACKEND_URL}${targetPath}`;

    try {
        const backendRes = await fetch(targetUrl, {
            method,
            headers,
            body,
        });

        // Forward response status and selected headers
        res.status(backendRes.status);

        const contentType = backendRes.headers.get('content-type');
        if (contentType) {
            res.setHeader('Content-Type', contentType);
        }
        const cacheControl = backendRes.headers.get('cache-control');
        if (cacheControl) {
            res.setHeader('Cache-Control', cacheControl);
        }
        const requestId = backendRes.headers.get('x-request-id');
        if (requestId) {
            res.setHeader('X-Request-Id', requestId);
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

        // Return response body
        const data = await backendRes.text();
        try {
            res.json(JSON.parse(data));
        } catch {
            res.send(data);
        }
    } catch (error) {
        console.error('API proxy error:', error);
        res.status(502).json({ error: 'Bad Gateway' });
    }
}

export const config = {
    api: {
        bodyParser: true,
    },
};
