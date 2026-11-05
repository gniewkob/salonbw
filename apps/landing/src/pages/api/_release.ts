import fs from 'node:fs';
import path from 'node:path';
import type { NextApiRequest, NextApiResponse } from 'next';
import { developmentAccessAllowed } from '@salonbw/api';

/**
 * Server-side release identity for the temporary DEV Landing.
 * Middleware is not sufficient for physical public/ files on MyDevil nginx,
 * so the metadata is stored outside public/ and rechecked here.
 */
export default async function handler(
    request: NextApiRequest,
    response: NextApiResponse,
) {
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
    response.setHeader('X-Content-Type-Options', 'nosniff');

    if (process.env.APP_ENV !== 'development') {
        return response.status(404).end();
    }

    if (!(await developmentAccessAllowed(request.headers.authorization ?? null))) {
        response.setHeader('WWW-Authenticate', 'Basic realm="SalonBW development"');
        return response.status(401).end('Development access required');
    }

    if (request.method !== 'GET' && request.method !== 'HEAD') {
        response.setHeader('Allow', 'GET, HEAD');
        return response.status(405).end();
    }

    const metadataPath =
        process.env.SALONBW_PRIVATE_RELEASE_METADATA_PATH ||
        path.join(process.cwd(), '.next', '__release.private.json');

    try {
        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8')) as {
            sha?: string;
            environment?: string;
            api?: string;
            buildId?: string;
        };
        if (
            !/^[a-f0-9]{40}$/.test(metadata.sha || '') ||
            metadata.environment !== 'development' ||
            typeof metadata.api !== 'string' ||
            typeof metadata.buildId !== 'string' ||
            !metadata.buildId
        ) {
            throw new Error('Invalid private release manifest');
        }
        if (request.method === 'HEAD') {
            return response.status(200).end();
        }
        return response.status(200).json(metadata);
    } catch {
        return response.status(503).json({ error: 'Release identity unavailable' });
    }
}
