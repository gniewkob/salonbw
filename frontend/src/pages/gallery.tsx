import { GetServerSideProps } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import { useState } from 'react';
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

export default function GalleryPage({ items }: GalleryPageProps) {
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
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
                                    setLightboxIndex(i);
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
                {lightboxIndex !== null && (
                    <ImageLightbox
                        sources={items
                            .filter((it) => it.type === 'IMAGE')
                            .map((it) => it.imageUrl!)}
                        index={lightboxIndex}
                        alt={items.filter((it) => it.type === 'IMAGE')[
                            lightboxIndex
                        ]?.caption || 'Gallery preview'}
                        onPrev={() =>
                            setLightboxIndex((idx) =>
                                idx === null
                                    ? null
                                    : (idx +
                                          items.filter(
                                              (it) => it.type === 'IMAGE',
                                          ).length -
                                          1) %
                                      items.filter((it) => it.type === 'IMAGE')
                                          .length,
                            )
                        }
                        onNext={() =>
                            setLightboxIndex((idx) =>
                                idx === null
                                    ? null
                                    : (idx + 1) %
                                      items.filter(
                                          (it) => it.type === 'IMAGE',
                                      ).length,
                            )
                        }
                        onClose={() => setLightboxIndex(null)}
                    />
                )}
            </div>
        </PublicLayout>
    );
}

export const getServerSideProps: GetServerSideProps<
    GalleryPageProps
> = async () => {
    const token = process.env.INSTAGRAM_ACCESS_TOKEN;
    if (!token) {
        return { props: { items: [] } };
    }
    try {
        const res = await fetch(
            `https://graph.instagram.com/me/media?fields=id,caption,media_url,media_type,thumbnail_url&access_token=${token}`,
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
        return { props: { items } };
    } catch {
        return { props: { items: [] } };
    }
};
