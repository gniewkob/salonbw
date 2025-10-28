import { GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import type { Route } from 'next';
import { useEffect, useMemo } from 'react';
import { Service } from '@/types';
import PublicLayout from '@/components/PublicLayout';
import { trackEvent } from '@/utils/analytics';

interface ServiceCategory {
    id: number | null;
    name: string;
    services: Service[];
}

interface ServicesPageProps {
    categories: ServiceCategory[];
}

export default function ServicesPage({ categories }: ServicesPageProps) {
    const items = useMemo(
        () =>
            categories.flatMap((cat) =>
                cat.services.map((s) => ({
                    id: s.id,
                    name: s.name,
                    category: cat.name,
                })),
            ),
        [categories],
    );

    useEffect(() => {
        try {
            trackEvent('view_item_list', {
                item_list_name: 'services',
                items: items.slice(0, 25).map((it) => ({
                    item_id: it.id,
                    item_name: it.name,
                    item_category: it.category,
                })),
            });
        } catch {}
    }, [items]);

    function resolveServiceRoute(name: string): Route | undefined {
        const n = name.toLowerCase();
        if (n.includes('balayage')) return '/services/balayage' as Route;
        if (n.includes('highlight') || n.includes('lowlights'))
            return '/services/highlights' as Route;
        if (n.includes('color')) return '/services/coloring' as Route;
        return undefined;
    }

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
                                    <span>
                                        {(() => {
                                            const href = resolveServiceRoute(s.name);
                                            if (!href) return s.name;
                                            return (
                                                <Link
                                                    href={href}
                                                    onClick={() =>
                                                        trackEvent(
                                                            'select_item',
                                                            {
                                                                item_list_name:
                                                                    'services',
                                                                items: [
                                                                    {
                                                                        item_id:
                                                                            s.id,
                                                                        item_name:
                                                                            s.name,
                                                                        item_category:
                                                                            cat.name,
                                                                    },
                                                                ],
                                                            },
                                                        )
                                                    }
                                                    className="underline"
                                                >
                                                    {s.name}
                                                </Link>
                                            );
                                        })()}
                                    </span>
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
