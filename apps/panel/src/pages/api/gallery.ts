import type { NextApiRequest, NextApiResponse } from 'next';
import { cacheKey, readCache, writeCache } from '@/utils/instagramCache';
import type { CachedGalleryItem } from '@/utils/instagramCache';

interface InstagramMedia {
    id: string;
    media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
    media_url: string;
    caption?: string;
    thumbnail_url?: string;
}

interface InstagramResponse {
    data?: InstagramMedia[];
    paging?: {
        cursors?: {
            after?: string;
        };
    };
    error?: unknown;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    const token = process.env.INSTAGRAM_ACCESS_TOKEN;
    if (!token) {
        res.status(503).json({ items: [], nextCursor: null });
        return;
    }
    const after =
        typeof req.query.after === 'string' ? req.query.after : undefined;
    const limit = typeof req.query.limit === 'string' ? req.query.limit : '12';
    const force = req.query.force === '1' || req.query.force === 'true';
    const key = cacheKey(after, limit);
    if (!force) {
        const cached = readCache(key);
        if (cached) {
            res.status(200).json({ ...cached.data });
            return;
        }
    }
    const params = new URLSearchParams({
        fields: 'id,caption,media_url,media_type,thumbnail_url',
        access_token: token,
        limit,
    });
    if (after) params.set('after', after);
    const url = `https://graph.instagram.com/me/media?${params.toString()}`;
    try {
        const resp = await fetch(url, { method: 'GET' });
        if (!resp.ok) throw new Error('upstream_error');
        const json = (await resp.json()) as InstagramResponse;
        if (json?.error) throw new Error('upstream_error');
        const items: CachedGalleryItem[] = (json.data ?? []).map((m) => {
            if (m.media_type === 'VIDEO') {
                return {
                    id: m.id,
                    type: 'VIDEO',
                    videoUrl: m.media_url,
                    posterUrl: m.thumbnail_url,
                    caption: m.caption,
                };
            }
            return {
                id: m.id,
                type: 'IMAGE',
                imageUrl: m.media_url,
                caption: m.caption,
            };
        });
        const nextCursor = json?.paging?.cursors?.after ?? null;
        const payload = { items, nextCursor };
        writeCache(key, payload);
        res.status(200).json(payload);
    } catch {
        res.status(502).json({ items: [], nextCursor: null });
    }
}
