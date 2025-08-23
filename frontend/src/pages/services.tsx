import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { Service } from '@/types';
import PublicLayout from '@/components/PublicLayout';

interface ServiceCategory {
    id: number | null;
    name: string;
    services: Service[];
}

interface ServicesPageProps {
    categories: ServiceCategory[];
}

export default function ServicesPage({ categories }: ServicesPageProps) {
    return (
        <PublicLayout>
            <Head>
                <title>Our Services | Salon Black &amp; White</title>
                <meta
                    name="description"
                    content="Browse the full list of hair and beauty services offered at Salon Black &amp; White."
                />
            </Head>
            <div className="p-4 space-y-6">
                <h1 className="text-2xl font-bold">Our Services</h1>
                {categories.map((cat) => (
                    <div key={cat.id ?? 'uncategorized'} className="space-y-2">
                        <h2 className="text-xl font-semibold">{cat.name}</h2>
                        <ul className="space-y-1">
                            {cat.services.map((s) => (
                                <li
                                    key={s.id}
                                    className="flex justify-between border-b pb-1"
                                >
                                    <span>{s.name}</span>
                                    <span className="text-sm text-gray-600">
                                        {s.duration} min - {s.price} zł
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </PublicLayout>
    );
}

export const getServerSideProps: GetServerSideProps<
    ServicesPageProps
> = async () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? '';
    try {
        const res = await fetch(`${apiUrl}/services`);
        const data: Service[] = await res.json();
        const map = new Map<number | null, ServiceCategory>();
        for (const svc of data) {
            const key = svc.category?.id ?? null;
            const name = svc.category?.name ?? 'Other';
            if (!map.has(key)) {
                map.set(key, { id: key, name, services: [] });
            }
            map.get(key)!.services.push(svc);
        }
        return { props: { categories: Array.from(map.values()) } };
    } catch {
        return { props: { categories: [] } };
    }
};
