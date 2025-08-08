import { GetServerSideProps } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import PublicLayout from '@/components/PublicLayout';

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
                    {items.map((item) => (
                        <Image
                            key={item.id}
                            src={item.imageUrl}
                            alt={item.caption ?? 'Gallery image'}
                            width={500}
                            height={500}
                            className="w-full h-auto object-cover"
                        />
                    ))}
                </div>
            </div>
        </PublicLayout>
    );
}

export const getServerSideProps: GetServerSideProps<GalleryPageProps> = async () => {
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
