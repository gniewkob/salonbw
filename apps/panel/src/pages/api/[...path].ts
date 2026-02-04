import type { NextApiRequest, NextApiResponse } from 'next';

const BACKEND_URL =
    process.env.API_PROXY_URL || 'https://api.salon-bw.pl';

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
    const targetPath = '/' + pathSegments.join('/');

    // Read access token from cookie
    const accessToken = req.cookies.accessToken;

    // Build headers
    const headers: Record<string, string> = {
        'Content-Type': req.headers['content-type'] || 'application/json',
    };

    if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
    }

    // Forward other relevant headers
    if (req.headers['x-requested-with']) {
        headers['X-Requested-With'] = req.headers['x-requested-with'] as string;
    }

    const targetUrl = `${BACKEND_URL}${targetPath}`;

    try {
        const backendRes = await fetch(targetUrl, {
            method: req.method,
            headers,
            body:
                req.method !== 'GET' && req.method !== 'HEAD'
                    ? JSON.stringify(req.body)
                    : undefined,
        });

        // Forward response status and headers
        res.status(backendRes.status);

        const contentType = backendRes.headers.get('content-type');
        if (contentType) {
            res.setHeader('Content-Type', contentType);
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
