import { GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import type { Route } from 'next';
import { useEffect, useMemo } from 'react';
import { Service } from '@/types';
import PublicLayout from '@/components/PublicLayout';
import { trackEvent } from '@/utils/analytics';
import { BUSINESS_INFO } from '@/config/content';
import { getPanelUrl } from '@/utils/panelUrl';

interface ServiceCategory {
    id: number | null;
    name: string;
    services: Service[];
}

interface ServicesPageProps {
    categories: ServiceCategory[];
}

function resolveCategoryName(service: Service): string {
    return (
        service.categoryRelation?.name ||
        service.category ||
        'Inne'
    );
}

function getServicePrice(service: Service): { label: string } {
    if (service.variants && service.variants.length > 0) {
        const prices = service.variants.map((v) => v.price);
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        const formattedMin = new Intl.NumberFormat('pl-PL', {
            style: 'currency',
            currency: 'PLN',
        }).format(min);
        if (max > min) {
            return { label: `od ${formattedMin}` };
        }
        return { label: formattedMin };
    }
    const formatted = new Intl.NumberFormat('pl-PL', {
        style: 'currency',
        currency: 'PLN',
    }).format(service.price);
    return {
        label: service.priceType === 'from' ? `od ${formatted}` : formatted,
    };
}

function getServiceDuration(service: Service): string {
    if (service.variants && service.variants.length > 0) {
        const durations = service.variants.map((v) => v.duration);
        const min = Math.min(...durations);
        const max = Math.max(...durations);
        return min === max ? `${min} min` : `${min}-${max} min`;
    }
    return `${service.duration} min`;
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
                <title>
                    Usługi fryzjerskie, barber i pielęgnacja -{' '}
                    {BUSINESS_INFO.name}
                </title>
                <meta
                    name="description"
                    content={`Profesjonalne usługi fryzjerskie dla kobiet i mężczyzn w ${BUSINESS_INFO.address.city}. Fryzjer damski, barber, pielęgnacja włosów (Botox, Złote proteiny, Sauna-SPA), przedłużanie włosów metodą HairTalk.`}
                />
                <meta
                    name="keywords"
                    content="usługi fryzjerskie bytom, barber bytom, pielęgnacja włosów, przedłużanie włosów, salon fryzjerski bytom"
                />
            </Head>
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl md:text-4xl font-bold mb-4">
                            Nasze Usługi
                        </h1>
                        <p className="text-gray-600 mb-6">
                            Oferujemy szeroki zakres usług fryzjerskich i
                            kosmetycznych dla kobiet i mężczyzn. Sprawdź naszą
                            ofertę i umów się na wizytę!
                        </p>
                        <a
                            href={getPanelUrl(BUSINESS_INFO.booking.url)}
                            className="inline-block bg-brand-gold text-white px-8 py-3 rounded-md hover:bg-yellow-700 transition focus:outline-none focus:ring-2 focus:ring-brand-gold"
                        >
                            {BUSINESS_INFO.booking.text}
                        </a>
                    </div>
                </div>

                <div className="max-w-5xl mx-auto space-y-12">
                    {categories.map((cat) => (
                        <div
                            key={cat.id ?? 'uncategorized'}
                            className="bg-white rounded-lg shadow-md p-6"
                        >
                            <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b border-gray-200 pb-3">
                                {cat.name}
                            </h2>
                            <div className="space-y-4">
                                {cat.services.map((s) => (
                                    <div
                                        key={s.id}
                                        className="flex justify-between items-start border-b border-gray-100 pb-4 last:border-b-0 last:pb-0"
                                    >
                                        <div className="flex-1">
                                            <span className="text-lg">
                                                {(() => {
                                                    const href =
                                                        resolveServiceRoute(
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
                                                            className="text-black hover:text-brand-gold transition focus:outline-none focus:underline"
                                                        >
                                                            {s.name}
                                                        </Link>
                                                    );
                                                })()}
                                            </span>
                                            {s.description && (
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {s.description}
                                                </p>
                                            )}
                                        </div>
                                        <div className="ml-4 text-right flex flex-col items-end">
                                            <span className="text-lg font-semibold text-brand-gold">
                                                {getServicePrice(s).label}
                                            </span>
                                            <span className="text-sm text-gray-500">
                                                {getServiceDuration(s)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    {/* CTA Section */}
                    <div className="text-center mt-12 p-8 bg-gray-50 rounded-lg">
                        <h3 className="text-2xl font-bold mb-4">
                            Gotowy/a na metamorfozę?
                        </h3>
                        <p className="text-gray-600 mb-6">
                            Umów się na wizytę i ciesz się profesjonalną obsługą
                            w naszym salonie.
                        </p>
                        <a
                            href={getPanelUrl(BUSINESS_INFO.booking.url)}
                            className="inline-block bg-black text-white px-8 py-3 rounded-md hover:bg-gray-800 transition focus:outline-none focus:ring-2 focus:ring-brand-gold"
                        >
                            {BUSINESS_INFO.booking.text}
                        </a>
                    </div>
                </div>
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
            name: 'Usługi fryzjerskie',
            services: [
                {
                    id: 1,
                    name: 'Strzyżenie damskie',
                    duration: 45,
                    price: 120,
                } as Service,
                {
                    id: 2,
                    name: 'Koloryzacja',
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
        {
            id: null,
            name: 'Barber',
            services: [
                {
                    id: 4,
                    name: 'Strzyżenie męskie',
                    duration: 30,
                    price: 80,
                } as Service,
                {
                    id: 5,
                    name: 'Strzyżenie brody',
                    duration: 20,
                    price: 50,
                } as Service,
            ],
        },
        {
            id: null,
            name: 'Pielęgnacja',
            services: [
                {
                    id: 6,
                    name: 'Botox na włosy',
                    duration: 60,
                    price: 200,
                } as Service,
                {
                    id: 7,
                    name: 'Złote proteiny',
                    duration: 45,
                    price: 150,
                } as Service,
                {
                    id: 8,
                    name: 'Sauna - SPA dla włosów',
                    duration: 30,
                    price: 100,
                } as Service,
            ],
        },
    ];
    try {
        const res = await fetch(`${apiUrl}/services/public`, {
            headers: { Accept: 'application/json' },
        });
        if (!res.ok) throw new Error('services_fetch_failed');
        const data: Service[] = await res.json();
        if (!Array.isArray(data) || data.length === 0) {
            return { props: { categories: fallbackCategories } };
        }
        const map = new Map<string, ServiceCategory>();
        for (const svc of data) {
            const categoryName = resolveCategoryName(svc);
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
