import { GetServerSideProps } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import { useState } from 'react';
import PublicLayout from '@/components/PublicLayout';
import ImageLightbox from '@/components/ImageLightbox';
import { trackEvent } from '@/utils/analytics';

interface GalleryItem {
    id: string;
    imageUrl: string;
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
                                                item_name: item.caption || `Gallery ${i + 1}`,
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
                                src={item.imageUrl}
                                alt={item.caption ?? 'Gallery image'}
                                width={500}
                                height={500}
                                className="w-full h-auto object-cover"
                            />
                        </button>
                    ))}
                </div>
                {lightboxIndex !== null && (
                    <ImageLightbox
                        sources={items.map((it) => it.imageUrl)}
                        index={lightboxIndex}
                        alt={items[lightboxIndex]?.caption || 'Gallery preview'}
                        onPrev={() =>
                            setLightboxIndex((idx) =>
                                idx === null
                                    ? null
                                    : (idx + items.length - 1) % items.length,
                            )
                        }
                        onNext={() =>
                            setLightboxIndex((idx) =>
                                idx === null ? null : (idx + 1) % items.length,
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
            `https://graph.instagram.com/me/media?fields=id,caption,media_url,media_type&access_token=${token}`,
        );
        const json: InstagramResponse = await res.json();
        const items: GalleryItem[] = (json.data ?? [])
            .filter((item) => item.media_type === 'IMAGE')
            .map(({ id, media_url, caption }) => ({
                id,
                imageUrl: media_url,
                caption,
            }));
        return { props: { items } };
    } catch {
        return { props: { items: [] } };
    }
};
