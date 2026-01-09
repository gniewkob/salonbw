type MediaType = 'IMAGE' | 'VIDEO';
export interface CachedGalleryItem {
    id: string;
    type: MediaType;
    imageUrl?: string;
    videoUrl?: string;
    posterUrl?: string;
    caption?: string;
}

interface CacheEntry {
    data: {
        items: CachedGalleryItem[];
        nextCursor: string | null;
        fallback: boolean;
    };
    expiresAt: number;
}

const DEFAULT_TTL_MS = 60_000;

type CacheKey = string;

declare global {
    // eslint-disable-next-line no-var
    var __INSTAGRAM_CACHE__: Map<CacheKey, CacheEntry> | undefined;
}

function getStore(): Map<CacheKey, CacheEntry> {
    if (!globalThis.__INSTAGRAM_CACHE__) {
        globalThis.__INSTAGRAM_CACHE__ = new Map<CacheKey, CacheEntry>();
    }
    return globalThis.__INSTAGRAM_CACHE__;
}

export function readCache(key: CacheKey): CacheEntry | null {
    const store = getStore();
    const entry = store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
        store.delete(key);
        return null;
    }
    return entry;
}

export function writeCache(
    key: CacheKey,
    data: CacheEntry['data'],
    ttlMs: number = DEFAULT_TTL_MS,
) {
    const store = getStore();
    store.set(key, {
        data,
        expiresAt: Date.now() + ttlMs,
    });
}

export function cacheKey(cursor?: string | null, limit?: string | number) {
    return `after:${cursor ?? ''}|limit:${limit ?? ''}`;
}
