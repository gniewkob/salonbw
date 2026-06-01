import { GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import type { Route } from 'next';
import { useEffect, useMemo, useState } from 'react';
import { Service } from '@/types';
import PublicLayout from '@/components/PublicLayout';
import { trackEvent } from '@/utils/analytics';
import { BUSINESS_INFO } from '@/config/content';
import { useLanguage } from '@/contexts/LanguageContext';
import BookingModal, { BookingService } from '@/components/BookingModal';

interface ServiceCategory {
    id: number | null;
    name: string;
    services: Service[];
}

interface ServicesPageProps {
    categories: ServiceCategory[];
}

function resolveCategoryName(service: Service): string {
    return service.categoryRelation?.name || service.category || 'Inne';
}

function getServicePrice(service: Service, fromLabel: string): string {
    if (service.variants && service.variants.length > 0) {
        const prices = service.variants.map((v) => v.price);
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        const fmt = (n: number) =>
            new Intl.NumberFormat('pl-PL', {
                style: 'currency',
                currency: 'PLN',
            }).format(n);
        return max > min ? `${fromLabel} ${fmt(min)}` : fmt(min);
    }
    const formatted = new Intl.NumberFormat('pl-PL', {
        style: 'currency',
        currency: 'PLN',
    }).format(service.price);
    return service.priceType === 'from' ? `${fromLabel} ${formatted}` : formatted;
}

function getServiceDuration(service: Service): string {
    if (service.variants && service.variants.length > 0) {
        const durations = service.variants.map((v) => v.duration);
        const min = Math.min(...durations);
        const max = Math.max(...durations);
        return min === max ? `${min} min` : `${min}–${max} min`;
    }
    return `${service.duration} min`;
}

const SERVICE_ROUTES: Record<string, Route> = {
    balayage: '/services/balayage',
    highlight: '/services/highlights',
    lowlight: '/services/highlights',
    color: '/services/coloring',
};

function resolveServiceRoute(name: string): Route | undefined {
    const n = name.toLowerCase();
    return Object.entries(SERVICE_ROUTES).find(([k]) => n.includes(k))?.[1];
}

export default function ServicesPage({ categories }: ServicesPageProps) {
    const { T } = useLanguage();
    const s = T.services;
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

    const [bookingService, setBookingService] = useState<BookingService | null>(null);
    const [generalBookingOpen, setGeneralBookingOpen] = useState(false);

    return (
        <PublicLayout>
            <Head>
                <title>Usługi fryzjerskie, barber i pielęgnacja — {BUSINESS_INFO.name}</title>
                <meta name="description" content={`Profesjonalne usługi fryzjerskie dla kobiet i mężczyzn w ${BUSINESS_INFO.address.city}. Fryzjer damski, barber, koloryzacja Wella (Air Touch, Koleston Perfect), pielęgnacja (Botox, Złote proteiny, Olaplex), przedłużanie włosów HairTalk.`} />
                <meta name="keywords" content="usługi fryzjerskie bytom, barber bytom, pielęgnacja włosów, przedłużanie włosów, salon fryzjerski bytom" />
                <meta property="og:title" content={`Usługi fryzjerskie — ${BUSINESS_INFO.name}`} />
                <meta property="og:description" content={`Profesjonalne usługi fryzjerskie, barber i pielęgnacja włosów w ${BUSINESS_INFO.address.city}. Koloryzacja, balayage, botox, HairTalk.`} />
                <meta property="og:image" content={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://salon-bw.pl'}/images/hero/slider1.jpg`} />
                <meta property="og:type" content="website" />
                <link rel="canonical" href={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://salon-bw.pl'}/services`} />
                <meta name="robots" content="index, follow" />
            </Head>

            <div className="svcs-page">
                {/* Hero */}
                <div className="svcs-hero">
                    <span className="svcs-hero__eyebrow">{s.pageEyebrow}</span>
                    <h1 className="svcs-hero__heading">{s.pageHeading}</h1>
                    <p className="svcs-hero__desc">{s.pageDesc}</p>
                    <button
                        onClick={() => setGeneralBookingOpen(true)}
                        className="btn-silver text-xs font-semibold uppercase focus:outline-none focus:ring-2 focus:ring-[#b4b8be] focus:ring-offset-2 focus:ring-offset-[#0d0d0d]"
                        style={{ padding: '0.85rem 2.5rem', borderRadius: '2px', letterSpacing: '0.16em' }}
                    >
                        {T.nav.booking}
                    </button>
                </div>

                {/* Service categories */}
                <div className="svcs-body">
                    {categories.map((cat) => (
                        <div key={cat.id ?? cat.name} className="svcs-category">
                            <div className="svcs-category__header">
                                <h2 className="svcs-category__title">{cat.name}</h2>
                                <span className="svcs-category__count">
                                    {cat.services.length}{' '}
                                    {cat.services.length === 1 ? s.serviceCount1 : s.serviceCountMany}
                                </span>
                            </div>

                            <div>
                                {cat.services.map((svc) => {
                                    const price = getServicePrice(svc, s.from);
                                    const duration = getServiceDuration(svc);
                                    const href = resolveServiceRoute(svc.name);
                                    return (
                                        <div key={svc.id} className="svcs-row">
                                            <div className="svcs-row__info">
                                                <div className="svcs-row__name">
                                                    {href ? (
                                                        <Link
                                                            href={href}
                                                            onClick={() =>
                                                                trackEvent('select_item', {
                                                                    item_list_name: 'services',
                                                                    items: [{ item_id: svc.id, item_name: svc.name, item_category: cat.name }],
                                                                })
                                                            }
                                                        >
                                                            {svc.name}
                                                        </Link>
                                                    ) : (
                                                        svc.name
                                                    )}
                                                </div>
                                                {svc.description && (
                                                    <p className="svcs-row__desc">{svc.description}</p>
                                                )}
                                            </div>
                                            <div className="svcs-row__meta">
                                                <span className="svcs-row__price">{price}</span>
                                                <span className="svcs-row__duration">{duration}</span>
                                                <button
                                                    className="svcs-row__book"
                                                    onClick={() =>
                                                        setBookingService({
                                                            id: svc.id,
                                                            name: svc.name,
                                                            priceLabel: price,
                                                            duration,
                                                        })
                                                    }
                                                    aria-label={`${s.bookBtn}: ${svc.name}`}
                                                >
                                                    {s.bookBtn}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    {/* Bottom CTA */}
                    <div className="svcs-bottom-cta">
                        <h2 className="svcs-bottom-cta__heading">
                            {s.ctaHeading}
                        </h2>
                        <p className="svcs-bottom-cta__sub">
                            {s.ctaSub.replace('{hours}', BUSINESS_INFO.hours.mondayFriday)}
                        </p>
                        <button
                            onClick={() => setGeneralBookingOpen(true)}
                            className="btn-silver text-xs font-semibold uppercase focus:outline-none focus:ring-2 focus:ring-[#b4b8be] focus:ring-offset-2 focus:ring-offset-[#0d0d0d]"
                            style={{ padding: '0.85rem 2.5rem', borderRadius: '2px', letterSpacing: '0.16em' }}
                        >
                            {T.nav.booking}
                        </button>
                        <p style={{ marginTop: '1.5rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
                            <a
                                href={`tel:${BUSINESS_INFO.contact.phone.replace(/\s/g, '')}`}
                                className="footer-link"
                            >
                                {BUSINESS_INFO.contact.phone}
                            </a>
                        </p>
                    </div>
                </div>
            </div>

            <BookingModal
                open={!!bookingService}
                onClose={() => setBookingService(null)}
                service={bookingService ?? undefined}
            />
            <BookingModal
                open={generalBookingOpen}
                onClose={() => setGeneralBookingOpen(false)}
            />
        </PublicLayout>
    );
}

export const getServerSideProps: GetServerSideProps<ServicesPageProps> = async () => {
    const rawBase =
        process.env.API_BASE_URL ||
        process.env.NEXT_PUBLIC_API_URL ||
        process.env.API_PROXY_URL ||
        'https://api.salon-bw.pl';
    const apiUrl = rawBase.replace(/\/$/, '');

    const fallbackCategories: ServiceCategory[] = [
        {
            id: null,
            name: 'Usługi dla kobiet',
            services: [
                { id: 1, name: 'Strzyżenie damskie', duration: 45, price: 150, priceType: 'from' } as Service,
                { id: 2, name: 'Koloryzacja Air Touch', duration: 180, price: 600, priceType: 'from' } as Service,
                { id: 3, name: 'Farbowanie Koleston Perfect', duration: 90, price: 320, priceType: 'from' } as Service,
                { id: 4, name: 'Fryzura ślubna', duration: 150, price: 280 } as Service,
                { id: 5, name: 'Botox na włosy', duration: 60, price: 300, priceType: 'from' } as Service,
                { id: 6, name: 'Złote proteiny', duration: 90, price: 350, priceType: 'from' } as Service,
            ],
        },
        {
            id: null,
            name: 'Usługi dla mężczyzn',
            services: [
                { id: 7, name: 'Strzyżenie męskie', duration: 30, price: 80, priceType: 'from' } as Service,
                { id: 8, name: 'Strzyżenie brody', duration: 20, price: 60 } as Service,
                { id: 9, name: 'Combo włosy + broda + kompres', duration: 60, price: 130 } as Service,
                { id: 10, name: 'Golenie twarzy', duration: 25, price: 70 } as Service,
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
        return { props: { categories: categories.length ? categories : fallbackCategories } };
    } catch {
        return { props: { categories: fallbackCategories } };
    }
};
