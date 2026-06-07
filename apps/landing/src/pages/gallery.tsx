import { GetServerSideProps } from 'next';
import Head from 'next/head';
import Script from 'next/script';
import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import PublicLayout from '@/components/PublicLayout';
import ImageLightbox from '@/components/ImageLightbox';
import SectionHeader from '@/components/SectionHeader';
import { trackEvent } from '@/utils/analytics';
import { useLanguage } from '@/contexts/LanguageContext';
import { BUSINESS_INFO } from '@/config/content';
import { jsonLd, absUrl } from '@/utils/seo';
import {
    cacheKey,
    readCache,
    writeCache,
    CachedGalleryItem,
} from '@/utils/instagramCache';

type GalleryItem = CachedGalleryItem;

const SAMPLE_ITEMS: GalleryItem[] = [
    '/assets/img/slider/slider1.jpg',
    '/assets/img/slider/slider2.jpg',
    '/assets/img/slider/slider3.jpg',
].map((src, idx) => ({
    id: `local-${idx}`,
    type: 'IMAGE',
    imageUrl: src,
    caption: 'Sample',
}));

interface GalleryPageProps {
    items: GalleryItem[];
    nextCursor: string | null;
    fallback: boolean;
}

interface InstagramMedia {
    id: string;
    media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
    media_url: string;
    caption?: string;
    thumbnail_url?: string;
}

interface InstagramResponse {
    data?: InstagramMedia[];
    paging?: { cursors?: { after?: string } };
    error?: unknown;
}

interface GalleryApiResponse {
    items?: GalleryItem[];
    nextCursor?: string | null;
    fallback?: boolean;
}

export default function GalleryPage({
    items: initialItems,
    nextCursor: initialCursor,
    fallback,
}: GalleryPageProps) {
    const { T } = useLanguage();
    const g = T.gallery;
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    const [items, setItems] = useState<GalleryItem[]>(initialItems);
    const [isFallback, setIsFallback] = useState(fallback);
    const imageItems = useMemo(
        () => items.filter((it) => (it.type ?? 'IMAGE') !== 'VIDEO'),
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
    const [retrying, setRetrying] = useState(false);

    const handleRetry = async () => {
        setRetrying(true);
        setError(null);
        try {
            const res = await fetch('/api/gallery?force=1&limit=12');
            if (!res.ok) throw new Error('Failed to refresh');
            const json = (await res.json()) as GalleryApiResponse;
            setItems(json.items ?? []);
            setNextCursor(json.nextCursor ?? null);
            setIsFallback(json.fallback ?? false);
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setRetrying(false);
        }
    };

    useEffect(() => {
        if (!sentinelRef.current) return;
        if (!nextCursor || isFallback) return;
        const el = sentinelRef.current;
        const loadMore = async () => {
            setLoading(true);
            try {
                const res = await fetch(
                    `/api/gallery?after=${encodeURIComponent(nextCursor)}`,
                );
                if (!res.ok) throw new Error('Failed to load more');
                const json = (await res.json()) as GalleryApiResponse;
                setItems((prev) => [...prev, ...(json.items ?? [])]);
                setNextCursor(json.nextCursor ?? null);
                setIsFallback(json.fallback ?? false);
            } catch (e) {
                setError((e as Error).message);
            } finally {
                setLoading(false);
            }
        };
        const io = new IntersectionObserver(
            (entries) => {
                const entry = entries[0];
                if (!entry?.isIntersecting || loading) return;
                void loadMore();
            },
            { rootMargin: '300px' },
        );
        io.observe(el);
        return () => io.disconnect();
    }, [nextCursor, loading, isFallback]);

    const openLightbox = (item: GalleryItem, i: number) => {
        if (item.type === 'VIDEO') return;
        const idx = imageIndexMap.get(item.id);
        if (idx === undefined) return;
        setLightboxIndex(idx);
        try {
            trackEvent('select_item', {
                item_list_name: 'gallery',
                items: [
                    {
                        item_id: item.id,
                        item_name: item.caption || `Gallery ${i + 1}`,
                        item_category: 'Gallery',
                    },
                ],
                cta: 'gallery_grid',
            });
        } catch {}
    };

    return (
        <PublicLayout>
            <Head>
                <title>Galeria | Salon Black &amp; White</title>
                <meta
                    name="description"
                    content="Galeria realizacji Salonu Black & White — profesjonalne fryzury, stylizacje i koloryzacje z Bytomia."
                />
                <meta
                    property="og:title"
                    content="Galeria realizacji — Salon Black & White"
                />
                <meta
                    property="og:description"
                    content="Galeria realizacji Salonu Black & White — profesjonalne fryzury, stylizacje i koloryzacje z Bytomia."
                />
                <meta
                    property="og:image"
                    content={absUrl('/images/hero/slider1.jpg')}
                />
                <meta property="og:image:width" content="1200" />
                <meta property="og:image:height" content="630" />
                <meta property="og:type" content="website" />
                <meta property="og:locale" content="pl_PL" />
                <meta property="og:url" content={absUrl('/gallery')} />
                <link rel="canonical" href={absUrl('/gallery')} />
                <meta name="robots" content="index, follow" />
            </Head>
            <Script
                id="ld-gallery"
                type="application/ld+json"
                strategy="afterInteractive"
            >
                {jsonLd({
                    '@context': 'https://schema.org',
                    '@type': 'WebPage',
                    name: 'Galeria realizacji — Salon Black & White',
                    description:
                        'Galeria realizacji Salonu Black & White — profesjonalne fryzury, stylizacje i koloryzacje z Bytomia.',
                    url: absUrl('/gallery'),
                    isPartOf: {
                        '@type': 'HairSalon',
                        name: BUSINESS_INFO.name,
                        address: {
                            '@type': 'PostalAddress',
                            streetAddress: BUSINESS_INFO.address.street,
                            addressLocality: BUSINESS_INFO.address.city,
                            postalCode: BUSINESS_INFO.address.postalCode,
                            addressCountry: 'PL',
                        },
                    },
                })}
            </Script>

            <div className="ig-page">
                <div className="ig-hero container mx-auto px-4 md:px-8">
                    <SectionHeader
                        eyebrow={g.eyebrow}
                        title={g.title}
                        subtitle={g.subtitle}
                        dark
                        as="h1"
                    />

                    {isFallback && (
                        <div className="ig-fallback">
                            <span className="ig-fallback__text">
                                {g.fallback}
                            </span>
                            <button
                                type="button"
                                className="ig-fallback__btn"
                                onClick={() => {
                                    void handleRetry();
                                }}
                                disabled={retrying}
                            >
                                {retrying ? g.loading : g.refresh}
                            </button>
                        </div>
                    )}
                </div>

                <div className="ig-masonry">
                    {items.map((item, i) => {
                        if (item.type === 'VIDEO' && item.videoUrl) {
                            return (
                                <div
                                    key={item.id}
                                    className="ig-item ig-item--video"
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
                                                        item_category:
                                                            'Gallery',
                                                    },
                                                ],
                                                cta: 'gallery_video_play',
                                            });
                                        } catch {}
                                    }}
                                >
                                    {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                                    <video
                                        controls
                                        preload="metadata"
                                        poster={item.posterUrl}
                                        style={{
                                            display: 'block',
                                            width: '100%',
                                            height: 'auto',
                                        }}
                                    >
                                        <source src={item.videoUrl} />
                                    </video>
                                    {item.caption && (
                                        <div
                                            className="gallery-caption"
                                            style={{
                                                opacity: 1,
                                                transform: 'none',
                                            }}
                                        >
                                            <span className="gallery-caption__accent" />
                                            <span className="gallery-caption__text">
                                                {item.caption.split('\n')[0]}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            );
                        }

                        return (
                            <button
                                key={item.id}
                                type="button"
                                className="ig-item"
                                onClick={() => openLightbox(item, i)}
                                aria-label={
                                    item.caption
                                        ? `${g.open}: ${item.caption.split('\n')[0]}`
                                        : `${g.openPhoto} ${i + 1}`
                                }
                            >
                                <Image
                                    src={item.imageUrl!}
                                    alt={item.caption ?? g.imageAlt}
                                    width={600}
                                    height={600}
                                    style={{
                                        display: 'block',
                                        width: '100%',
                                        height: 'auto',
                                    }}
                                    sizes="(min-width: 1200px) 25vw, (min-width: 768px) 33vw, 50vw"
                                />
                                {item.caption && (
                                    <div className="gallery-caption">
                                        <span className="gallery-caption__accent" />
                                        <span className="gallery-caption__text">
                                            {item.caption
                                                .split('\n')[0]
                                                ?.slice(0, 60)}
                                        </span>
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>

                {!isFallback && (
                    <div ref={sentinelRef} className="ig-loading">
                        {loading ? (
                            <span className="ig-loading__dots">···</span>
                        ) : nextCursor ? (
                            g.scrollMore
                        ) : (
                            g.end
                        )}
                    </div>
                )}

                {error && (
                    <p
                        className="text-center text-xs pb-8"
                        role="alert"
                        aria-live="assertive"
                        style={{ color: 'rgba(255,255,255,0.6)' }}
                    >
                        {error}
                    </p>
                )}
            </div>

            {lightboxIndex !== null && (
                <ImageLightbox
                    sources={imageItems.map((it) => it.imageUrl!)}
                    index={lightboxIndex}
                    alt={imageItems[lightboxIndex]?.caption || g.preview}
                    onPrev={() =>
                        setLightboxIndex((idx) =>
                            idx === null
                                ? null
                                : (idx + imageItems.length - 1) %
                                  imageItems.length,
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
        </PublicLayout>
    );
}

export const getServerSideProps: GetServerSideProps<
    GalleryPageProps
> = async () => {
    const token = process.env.INSTAGRAM_ACCESS_TOKEN;
    if (!token) {
        return {
            props: { items: SAMPLE_ITEMS, nextCursor: null, fallback: true },
        };
    }
    const key = cacheKey(null, '12|ssr');
    const cached = readCache(key);
    if (cached) {
        return {
            props: {
                items: cached.data.items,
                nextCursor: cached.data.nextCursor,
                fallback: cached.data.fallback,
            },
        };
    }
    try {
        const res = await fetch(
            `https://graph.instagram.com/me/media?fields=id,caption,media_url,media_type,thumbnail_url&limit=12&access_token=${token}`,
        );
        if (!res.ok) throw new Error('upstream_error');
        const json = (await res.json()) as InstagramResponse;
        if (json?.error) throw new Error('upstream_error');
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
        const nextCursor = json?.paging?.cursors?.after ?? null;
        if (!items.length) throw new Error('no_media');
        writeCache(key, { items, nextCursor, fallback: false });
        return { props: { items, nextCursor, fallback: false } };
    } catch {
        return {
            props: { items: SAMPLE_ITEMS, nextCursor: null, fallback: true },
        };
    }
};
