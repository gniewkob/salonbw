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
                                            const href = resolveServiceRoute(
                                                s.name,
                                            );
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
    const rawBase =
        process.env.API_BASE_URL ||
        process.env.NEXT_PUBLIC_API_URL ||
        process.env.API_PROXY_URL ||
        'https://api.salon-bw.pl';
    const apiUrl = rawBase.replace(/\/$/, '');
    const fallbackCategories: ServiceCategory[] = [
        {
            id: null,
            name: 'Popular Services',
            services: [
                { id: 1, name: 'Haircut', duration: 45, price: 120 } as Service,
                {
                    id: 2,
                    name: 'Coloring',
                    duration: 90,
                    price: 240,
                } as Service,
                {
                    id: 3,
                    name: 'Balayage',
                    duration: 120,
                    price: 320,
                } as Service,
            ],
        },
    ];
    try {
        const res = await fetch(`${apiUrl}/services`, {
            headers: { Accept: 'application/json' },
        });
        if (!res.ok) throw new Error('services_fetch_failed');
        const data: Service[] = await res.json();
        if (!Array.isArray(data) || data.length === 0) {
            return { props: { categories: fallbackCategories } };
        }
        const map = new Map<string, ServiceCategory>();
        for (const svc of data) {
            const categoryName = svc.category ?? 'Other';
            if (!map.has(categoryName)) {
                map.set(categoryName, { id: null, name: categoryName, services: [] });
            }
            map.get(categoryName)!.services.push(svc);
        }
        const categories = Array.from(map.values());
        if (!categories.length) {
            return { props: { categories: fallbackCategories } };
        }
        return { props: { categories } };
    } catch {
        return { props: { categories: fallbackCategories } };
    }
};
