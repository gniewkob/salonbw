import type { NextApiRequest, NextApiResponse } from 'next';

type MediaType = 'IMAGE' | 'VIDEO';
interface GalleryItem {
  id: string;
  type: MediaType;
  imageUrl?: string;
  videoUrl?: string;
  posterUrl?: string;
  caption?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!token) {
    res.status(200).json({ items: [], nextCursor: null });
    return;
  }
  const after = typeof req.query.after === 'string' ? req.query.after : undefined;
  const limit = typeof req.query.limit === 'string' ? req.query.limit : '12';
  const params = new URLSearchParams({
    fields: 'id,caption,media_url,media_type,thumbnail_url',
    access_token: token,
    limit,
  });
  if (after) params.set('after', after);
  const url = `https://graph.instagram.com/me/media?${params.toString()}`;
  try {
    const resp = await fetch(url, { method: 'GET' });
    if (!resp.ok) {
      res.status(resp.status).json({ error: 'upstream_error' });
      return;
    }
    const json = await resp.json();
    const items: GalleryItem[] = (json.data ?? []).map((m: any) => {
      if (m.media_type === 'VIDEO') {
        return { id: m.id, type: 'VIDEO', videoUrl: m.media_url, posterUrl: m.thumbnail_url, caption: m.caption };
      }
      return { id: m.id, type: 'IMAGE', imageUrl: m.media_url, caption: m.caption };
    });
    const nextCursor = json?.paging?.cursors?.after ?? null;
    res.status(200).json({ items, nextCursor });
  } catch (e) {
    res.status(500).json({ error: 'network_error' });
  }
}

