import { GetServerSideProps } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import PublicLayout from '@/components/PublicLayout';
import ImageLightbox from '@/components/ImageLightbox';
import { trackEvent } from '@/utils/analytics';

type MediaType = 'IMAGE' | 'VIDEO';

interface GalleryItem {
    id: string;
    type: MediaType;
    imageUrl?: string;
    videoUrl?: string;
    posterUrl?: string;
    caption?: string;
}

interface GalleryPageProps {
    items: GalleryItem[];
    nextCursor: string | null;
    fallback: boolean;
}

interface InstagramMedia {
    id: string;
    media_type: string;
    media_url: string;
    caption?: string;
    thumbnail_url?: string;
}

interface InstagramResponse {
    data?: InstagramMedia[];
}

export default function GalleryPage({ items: initialItems, nextCursor: initialCursor, fallback }: GalleryPageProps) {
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    const [items, setItems] = useState<GalleryItem[]>(initialItems);
    const [isFallback, setIsFallback] = useState(fallback);
    const imageItems = useMemo(
        () => items.filter((it) => it.type === 'IMAGE'),
        [items],
    );
    const imageIndexMap = useMemo(() => {
        const map = new Map<string, number>();
        imageItems.forEach((it, idx) => map.set(it.id, idx));
        return map;
    }, [imageItems]);
    const [nextCursor, setNextCursor] = useState<string | null>(initialCursor);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const sentinelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!sentinelRef.current) return;
        if (!nextCursor || isFallback) return; // no infinite load in fallback mode
        const el = sentinelRef.current;
        const io = new IntersectionObserver(async (entries) => {
            const entry = entries[0];
            if (!entry.isIntersecting) return;
            if (loading) return;
            setLoading(true);
            try {
                const res = await fetch(`/api/gallery?after=${encodeURIComponent(nextCursor)}`);
                if (!res.ok) throw new Error('Failed to load more');
                const json = await res.json();
                const more: GalleryItem[] = json.items ?? [];
                setItems((prev) => [...prev, ...more]);
                setNextCursor(json.nextCursor ?? null);
                setIsFallback(json.fallback ?? false);
            } catch (e) {
                setError((e as Error).message);
            } finally {
                setLoading(false);
            }
        }, { rootMargin: '200px' });
        io.observe(el);
        return () => io.disconnect();
    }, [nextCursor, loading, isFallback]);
    return (
        <PublicLayout>
            <Head>
                <title>Gallery | Salon Black &amp; White</title>
                <meta
                    name="description"
                    content="See examples of our work in the Salon Black &amp; White gallery."
                />
            </Head>
            <div className="p-4 space-y-4">
                <h1 className="text-2xl font-bold">Gallery</h1>
                {isFallback && (
                    <p className="text-sm text-gray-600">Showing sample images. Connect Instagram to display latest media.</p>
                )}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {items.map((item, i) => (
                        item.type === 'VIDEO' && item.videoUrl ? (
                            <div key={item.id} className="relative">
                                {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                                <video
                                    controls
                                    preload="metadata"
                                    poster={item.posterUrl}
                                    className="w-full h-auto object-cover"
                                    onPlay={() => {
                                        try {
                                            trackEvent('select_item', {
                                                item_list_name: 'gallery',
                                                items: [
                                                    {
                                                        item_id: item.id,
                                                        item_name:
                                                            item.caption ||
                                                            `Gallery ${i + 1}`,
                                                        item_category: 'Gallery',
                                                    },
                                                ],
                                                cta: 'gallery_video_play',
                                            });
                                        } catch {}
                                    }}
                                >
                                    <source src={item.videoUrl} />
                                </video>
                            </div>
                        ) : (
                            <button
                                key={item.id}
                                type="button"
                                className="relative"
                                onClick={() => {
                                    const idx = imageIndexMap.get(item.id);
                                    if (idx === undefined) return;
                                    setLightboxIndex(idx);
                                    try {
                                        trackEvent('select_item', {
                                            item_list_name: 'gallery',
                                            items: [
                                                {
                                                    item_id: item.id,
                                                    item_name:
                                                        item.caption ||
                                                        `Gallery ${i + 1}`,
                                                    item_category: 'Gallery',
                                                },
                                            ],
                                            cta: 'gallery_grid',
                                        });
                                    } catch {}
                                }}
                                aria-label={`Open image ${i + 1}`}
                            >
                                <Image
                                    src={item.imageUrl!}
                                    alt={item.caption ?? 'Gallery image'}
                                    width={500}
                                    height={500}
                                    className="w-full h-auto object-cover"
                                />
                            </button>
                        )
                    ))}
                </div>
                {!isFallback && (
                    <div ref={sentinelRef} className="h-10 flex items-center justify-center">
                        {loading ? <span className="text-sm text-gray-500">Loading…</span> : nextCursor ? <span className="text-sm text-gray-400">Scroll for more</span> : <span className="text-sm text-gray-400">No more items</span>}
                    </div>
                )}
                {lightboxIndex !== null && (
                    <ImageLightbox
                        sources={imageItems.map((it) => it.imageUrl!)}
                        index={lightboxIndex}
                        alt={imageItems[lightboxIndex]?.caption || 'Gallery preview'}
                        onPrev={() =>
                            setLightboxIndex((idx) =>
                                idx === null
                                    ? null
                                    : (idx + imageItems.length - 1) % imageItems.length,
                            )
                        }
                        onNext={() =>
                            setLightboxIndex((idx) =>
                                idx === null ? null : (idx + 1) % imageItems.length,
                            )
                        }
                        onClose={() => setLightboxIndex(null)}
                    />
                )}
            </div>
        </PublicLayout>
    );
}

export const getServerSideProps: GetServerSideProps<GalleryPageProps> = async () => {
    const token = process.env.INSTAGRAM_ACCESS_TOKEN;
    if (!token) {
        // Fallback to local sample images
        const sample: GalleryItem[] = ['/assets/img/slider/slider1.jpg','/assets/img/slider/slider2.jpg','/assets/img/slider/slider3.jpg'].map((src, idx) => ({ id: `local-${idx}`, type: 'IMAGE', imageUrl: src, caption: 'Sample' }));
        return { props: { items: sample, nextCursor: null, fallback: true } };
    }
    try {
        const res = await fetch(
            `https://graph.instagram.com/me/media?fields=id,caption,media_url,media_type,thumbnail_url&limit=12&access_token=${token}`,
        );
        const json: InstagramResponse = await res.json();
        const items: GalleryItem[] = (json.data ?? []).map(
            ({ id, media_url, media_type, caption, thumbnail_url }) => {
                if (media_type === 'VIDEO') {
                    return {
                        id,
                        type: 'VIDEO',
                        videoUrl: media_url,
                        posterUrl: thumbnail_url,
                        caption,
                    } satisfies GalleryItem;
                }
                return {
                    id,
                    type: 'IMAGE',
                    imageUrl: media_url,
                    caption,
                } satisfies GalleryItem;
            },
        );
        const nextCursor = (json as any)?.paging?.cursors?.after ?? null;
        return { props: { items, nextCursor, fallback: false } };
    } catch {
        // Fallback to local sample images on failure
        const sample: GalleryItem[] = ['/assets/img/slider/slider1.jpg','/assets/img/slider/slider2.jpg','/assets/img/slider/slider3.jpg'].map((src, idx) => ({ id: `local-${idx}`, type: 'IMAGE', imageUrl: src, caption: 'Sample' }));
        return { props: { items: sample, nextCursor: null, fallback: true } };
    }
};
