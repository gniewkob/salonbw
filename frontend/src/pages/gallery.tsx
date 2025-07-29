import { GetServerSideProps } from 'next';
import Head from 'next/head';

interface GalleryItem {
    id: number;
    imageUrl: string;
    caption?: string;
}

interface GalleryPageProps {
    items: GalleryItem[];
}

export default function GalleryPage({ items }: GalleryPageProps) {
    return (
        <>
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
                        <img
                            key={item.id}
                            src={item.imageUrl}
                            alt={item.caption ?? 'Gallery image'}
                            className="w-full h-auto object-cover"
                        />
                    ))}
                </div>
            </div>
        </>
    );
}

export const getServerSideProps: GetServerSideProps<
    GalleryPageProps
> = async () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? '';
    try {
        const res = await fetch(`${apiUrl}/gallery`);
        const data = await res.json();
        return { props: { items: data } };
    } catch {
        return { props: { items: [] } };
    }
};
