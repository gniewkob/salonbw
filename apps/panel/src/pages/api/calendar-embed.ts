import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Serves the vendored calendar HTML directly, bypassing Next.js page rendering.
 * This avoids script loading conflicts with Next.js hydration.
 */
export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    // Check for auth token
    const accessToken = req.cookies.accessToken;
    if (!accessToken) {
        res.redirect(307, '/auth/login?redirectTo=/calendar');
        return;
    }

    try {
        const htmlPath = path.join(
            process.cwd(),
            'public',
            'versum-calendar',
            'index.html',
        );

        const html = await fs.readFile(htmlPath, 'utf8');

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.status(200).send(html);
    } catch (error) {
        console.error('Calendar embed error:', error);
        res.status(500).send('Calendar not available');
    }
}
