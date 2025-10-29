import type { NextApiRequest, NextApiResponse } from 'next';
import {
  cacheKey,
  readCache,
  writeCache,
  CachedGalleryItem,
} from '@/utils/instagramCache';

const sampleItems: CachedGalleryItem[] = ['/assets/img/slider/slider1.jpg','/assets/img/slider/slider2.jpg','/assets/img/slider/slider3.jpg'].map(
  (src, idx) => ({ id: `local-${idx}`, type: 'IMAGE', imageUrl: src, caption: 'Sample' }),
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!token) {
    res.status(200).json({ items: sampleItems, nextCursor: null, fallback: true });
    return;
  }
  const after = typeof req.query.after === 'string' ? req.query.after : undefined;
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
    const json = await resp.json();
    if (json?.error) throw new Error('upstream_error');
    const items: CachedGalleryItem[] = (json.data ?? []).map((m: any) => {
      if (m.media_type === 'VIDEO') {
        return { id: m.id, type: 'VIDEO', videoUrl: m.media_url, posterUrl: m.thumbnail_url, caption: m.caption };
      }
      return { id: m.id, type: 'IMAGE', imageUrl: m.media_url, caption: m.caption };
    });
    if (!items.length) throw new Error('no_media');
    const nextCursor = json?.paging?.cursors?.after ?? null;
    const payload = { items, nextCursor, fallback: false };
    writeCache(key, payload);
    res.status(200).json(payload);
  } catch (e) {
    res.status(200).json({ items: sampleItems, nextCursor: null, fallback: true });
  }
}
