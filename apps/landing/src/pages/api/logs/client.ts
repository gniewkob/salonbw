import type { NextApiRequest, NextApiResponse } from 'next';

const BACKEND_URL =
    process.env.API_PROXY_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'https://api.salon-bw.pl';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    if ((req.method || 'GET').toUpperCase() !== 'POST') {
        res.setHeader('Allow', 'POST');
        res.status(405).json({ error: 'Method Not Allowed' });
        return;
    }

    let body: Uint8Array;
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
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    if (body.byteLength > 0) {
        headers['Content-Length'] = String(body.byteLength);
    }

    const logToken = process.env.CLIENT_LOG_TOKEN;
    if (logToken) {
        headers['x-log-token'] = logToken;
    }

    const targetUrl = `${BACKEND_URL.replace(/\/$/, '')}/logs/client`;

    try {
        const backendRes = await fetch(targetUrl, {
            method: 'POST',
            headers,
            body:
                body.byteLength > 0
                    ? (Buffer.from(body) as unknown as RequestInit['body'])
                    : undefined,
        });

        res.status(backendRes.status);
        const contentType = backendRes.headers.get('content-type');
        if (contentType) {
            res.setHeader('content-type', contentType);
        }

        const responseBody = await backendRes.arrayBuffer();
        res.send(Buffer.from(responseBody));
    } catch (error) {
        console.error('Landing log proxy error:', error);
        res.status(502).json({ error: 'Bad Gateway' });
    }
}

export const config = {
    api: {
        bodyParser: false,
    },
};

const MAX_BODY_BYTES = 64 * 1024; // 64 KB — log payloads should be small

function readRawBody(req: NextApiRequest): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        let totalBytes = 0;
        req.on('data', (chunk: Buffer) => {
            totalBytes += chunk.byteLength;
            if (totalBytes > MAX_BODY_BYTES) {
                req.destroy();
                reject(Object.assign(new Error('Request body too large'), { code: 'BODY_TOO_LARGE' }));
                return;
            }
            chunks.push(chunk);
        });
        req.on('end', () => resolve(Buffer.concat(chunks)));
        req.on('error', reject);
    });
}
