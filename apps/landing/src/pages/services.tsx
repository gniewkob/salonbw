import { GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import Script from 'next/script';
import type { Route } from 'next';
import { useEffect, useMemo, useState } from 'react';
import { Service } from '@/types';
import PublicLayout from '@/components/PublicLayout';
import { trackEvent } from '@/utils/analytics';
import { SERVICE_FILTER } from '@/i18n/serviceDetail';
import { translateCategory, translateConcept } from '@/i18n/catalogNames';
import { BUSINESS_INFO } from '@/config/content';
import { useLanguage } from '@/contexts/LanguageContext';
import BookingModal, { BookingService } from '@/components/BookingModal';
import { jsonLd, absUrl } from '@/utils/seo';

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

interface ConceptGroup {
    key: string;
    name: string;
    services: Service[];
    priceLabel: string;
    durationLabel: string;
}

/**
 * Collapse the booking catalog into price-range concepts for the marketing
 * list. Booksy variants were imported as separate flat services named
 * "Koncept – długość włosów" (e.g. "Strzyżenie damskie – włosy długie"), so we
 * regroup by the part before " – " and show "od {min} zł" instead of dozens of
 * fixed-price rows. Premium audience wants "wiem co zapłacę", not a price list.
 */
function groupByConcept(
    services: Service[],
    fromLabel: string,
): ConceptGroup[] {
    const fmt = (n: number) =>
        new Intl.NumberFormat('pl-PL', {
            style: 'currency',
            currency: 'PLN',
        }).format(n);
    const order: string[] = [];
    const map = new Map<string, Service[]>();
    for (const svc of services) {
        const concept = svc.name.split(' – ')[0]!.trim();
        if (!map.has(concept)) {
            map.set(concept, []);
            order.push(concept);
        }
        map.get(concept)!.push(svc);
    }
    return order.map((name) => {
        const svcs = map.get(name)!;
        const prices = svcs.flatMap((v) =>
            v.variants && v.variants.length > 0
                ? v.variants.map((x) => x.price)
                : [v.price],
        );
        const durations = svcs.flatMap((v) =>
            v.variants && v.variants.length > 0
                ? v.variants.map((x) => x.duration)
                : [v.duration],
        );
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        const dMin = Math.min(...durations);
        const dMax = Math.max(...durations);
        const ranged =
            svcs.length > 1 ||
            min !== max ||
            svcs.some((v) => v.priceType === 'from');
        return {
            key: `${name}-${svcs[0]!.id}`,
            name,
            services: svcs,
            priceLabel: ranged ? `${fromLabel} ${fmt(min)}` : fmt(min),
            durationLabel:
                dMin === dMax ? `${dMin} min` : `${dMin}–${dMax} min`,
        };
    });
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
    const { T, lang } = useLanguage();
    const s = T.services;
    const filt = SERVICE_FILTER[lang];
    const [activeCategory, setActiveCategory] = useState<string>('all');
    const hasCategoryFilter = categories.length > 1;
    const visibleCategories =
        hasCategoryFilter && activeCategory !== 'all'
            ? categories.filter((c) => c.name === activeCategory)
            : categories;
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

    const [bookingService, setBookingService] = useState<BookingService | null>(
        null,
    );
    const [generalBookingOpen, setGeneralBookingOpen] = useState(false);

    return (
        <PublicLayout>
            <Head>
                <title>
                    Usługi fryzjerskie, barber i pielęgnacja —{' '}
                    {BUSINESS_INFO.name}
                </title>
                <meta
                    name="description"
                    content={`Profesjonalne usługi fryzjerskie dla kobiet i mężczyzn w ${BUSINESS_INFO.address.city}. Fryzjer damski, barber, koloryzacja Wella (Air Touch, Koleston Perfect), pielęgnacja (Botox, Złote proteiny, Olaplex), przedłużanie włosów HairTalk.`}
                />
                <meta
                    name="keywords"
                    content="usługi fryzjerskie bytom, barber bytom, pielęgnacja włosów, przedłużanie włosów, salon fryzjerski bytom"
                />
                <meta
                    property="og:title"
                    content={`Usługi fryzjerskie — ${BUSINESS_INFO.name}`}
                />
                <meta
                    property="og:description"
                    content={`Profesjonalne usługi fryzjerskie, barber i pielęgnacja włosów w ${BUSINESS_INFO.address.city}. Koloryzacja, balayage, botox, HairTalk.`}
                />
                <meta
                    property="og:image"
                    content={absUrl('/images/hero/slider1.jpg')}
                />
                <meta property="og:image:width" content="1200" />
                <meta property="og:image:height" content="630" />
                <meta property="og:type" content="website" />
                <meta property="og:locale" content="pl_PL" />
                <meta property="og:url" content={absUrl('/services')} />
                <link rel="canonical" href={absUrl('/services')} />
                <meta name="robots" content="index, follow" />
            </Head>
            <Script
                id="ld-services"
                type="application/ld+json"
                strategy="afterInteractive"
            >
                {jsonLd({
                    '@context': 'https://schema.org',
                    '@type': 'ItemList',
                    name: 'Usługi fryzjerskie — Black & White',
                    description: `Profesjonalne usługi fryzjerskie dla kobiet i mężczyzn w ${BUSINESS_INFO.address.city}.`,
                    url: absUrl('/services'),
                    provider: {
                        '@type': 'HairSalon',
                        name: BUSINESS_INFO.name,
                        address: {
                            '@type': 'PostalAddress',
                            streetAddress: BUSINESS_INFO.address.street,
                            addressLocality: BUSINESS_INFO.address.city,
                            postalCode: BUSINESS_INFO.address.postalCode,
                            addressCountry: 'PL',
                        },
                        telephone: BUSINESS_INFO.contact.phone,
                    },
                })}
            </Script>

            <div className="svcs-page">
                {/* Hero */}
                <div className="svcs-hero">
                    <span className="svcs-hero__eyebrow">{s.pageEyebrow}</span>
                    <h1 className="svcs-hero__heading">{s.pageHeading}</h1>
                    <p className="svcs-hero__desc">{s.pageDesc}</p>
                    <button
                        type="button"
                        onClick={() => setGeneralBookingOpen(true)}
                        className="btn-silver text-xs font-semibold uppercase focus:outline-none focus:ring-2 focus:ring-[#b4b8be] focus:ring-offset-2 focus:ring-offset-[#0d0d0d]"
                        style={{
                            padding: '0.85rem 2.5rem',
                            borderRadius: '2px',
                            letterSpacing: '0.16em',
                        }}
                    >
                        {T.nav.booking}
                    </button>
                </div>

                {/* Service categories */}
                <div className="svcs-body">
                    {hasCategoryFilter && (
                        <div
                            className="svcs-cat-filter"
                            role="group"
                            aria-label={filt.group}
                        >
                            <button
                                type="button"
                                className={`svcs-cat-chip${activeCategory === 'all' ? ' is-active' : ''}`}
                                aria-pressed={activeCategory === 'all'}
                                onClick={() => setActiveCategory('all')}
                            >
                                {filt.all}
                            </button>
                            {categories.map((cat) => (
                                <button
                                    key={cat.id ?? cat.name}
                                    type="button"
                                    className={`svcs-cat-chip${activeCategory === cat.name ? ' is-active' : ''}`}
                                    aria-pressed={activeCategory === cat.name}
                                    onClick={() => setActiveCategory(cat.name)}
                                >
                                    {translateCategory(cat.name, lang)}
                                </button>
                            ))}
                        </div>
                    )}
                    {visibleCategories.length === 0 ? (
                        <div className="svcs-category" role="status">
                            <div className="svcs-category__header">
                                <h2 className="svcs-category__title">
                                    {s.unavailableHeading}
                                </h2>
                            </div>
                            <p style={{ color: 'rgba(255,255,255,0.72)' }}>
                                {s.unavailableCopy}
                            </p>
                        </div>
                    ) : (
                        visibleCategories.map((cat) => {
                            const groups = groupByConcept(cat.services, s.from);
                            return (
                                <div
                                    key={cat.id ?? cat.name}
                                    className="svcs-category"
                                >
                                    <div className="svcs-category__header">
                                        <h2 className="svcs-category__title">
                                            {translateCategory(cat.name, lang)}
                                        </h2>
                                        <span className="svcs-category__count">
                                            {groups.length}{' '}
                                            {groups.length === 1
                                                ? s.serviceCount1
                                                : s.serviceCountMany}
                                        </span>
                                    </div>

                                    <div>
                                        {groups.map((group) => {
                                            const href = resolveServiceRoute(
                                                group.name,
                                            );
                                            const single =
                                                group.services.length === 1
                                                    ? group.services[0]!
                                                    : null;
                                            return (
                                                <div
                                                    key={group.key}
                                                    className="svcs-row"
                                                >
                                                    <div className="svcs-row__info">
                                                        <div className="svcs-row__name">
                                                            {href ? (
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
                                                                                            group
                                                                                                .services[0]!
                                                                                                .id,
                                                                                        item_name:
                                                                                            group.name,
                                                                                        item_category:
                                                                                            cat.name,
                                                                                    },
                                                                                ],
                                                                            },
                                                                        )
                                                                    }
                                                                >
                                                                    {translateConcept(
                                                                        group.name,
                                                                        lang,
                                                                    )}
                                                                </Link>
                                                            ) : (
                                                                translateConcept(
                                                                    group.name,
                                                                    lang,
                                                                )
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="svcs-row__meta">
                                                        <span className="svcs-row__price">
                                                            {group.priceLabel}
                                                        </span>
                                                        <span className="svcs-row__duration">
                                                            {
                                                                group.durationLabel
                                                            }
                                                        </span>
                                                        <button
                                                            type="button"
                                                            className="svcs-row__book"
                                                            onClick={() =>
                                                                single
                                                                    ? setBookingService(
                                                                          {
                                                                              id: single.id,
                                                                              name: single.name,
                                                                              priceLabel:
                                                                                  group.priceLabel,
                                                                              duration:
                                                                                  group.durationLabel,
                                                                          },
                                                                      )
                                                                    : setGeneralBookingOpen(
                                                                          true,
                                                                      )
                                                            }
                                                            aria-label={`${s.bookBtn}: ${translateConcept(group.name, lang)}`}
                                                        >
                                                            {s.bookBtn}
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })
                    )}

                    {/* Bottom CTA */}
                    <div className="svcs-bottom-cta">
                        <h2 className="svcs-bottom-cta__heading">
                            {s.ctaHeading}
                        </h2>
                        <p className="svcs-bottom-cta__sub">
                            {s.ctaSub.replace(
                                '{hours}',
                                BUSINESS_INFO.hours.mondayFriday,
                            )}
                        </p>
                        <button
                            type="button"
                            onClick={() => setGeneralBookingOpen(true)}
                            className="btn-silver text-xs font-semibold uppercase focus:outline-none focus:ring-2 focus:ring-[#b4b8be] focus:ring-offset-2 focus:ring-offset-[#0d0d0d]"
                            style={{
                                padding: '0.85rem 2.5rem',
                                borderRadius: '2px',
                                letterSpacing: '0.16em',
                            }}
                        >
                            {T.nav.booking}
                        </button>
                        <p
                            style={{
                                marginTop: '1.5rem',
                                fontSize: '0.8rem',
                                color: 'rgba(255,255,255,0.6)',
                            }}
                        >
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

export const getServerSideProps: GetServerSideProps<
    ServicesPageProps
> = async () => {
    const rawBase =
        process.env.API_BASE_URL ||
        process.env.NEXT_PUBLIC_API_URL ||
        process.env.API_PROXY_URL ||
        'https://api.salon-bw.pl';
    const apiUrl = rawBase.replace(/\/$/, '');

    try {
        const res = await fetch(`${apiUrl}/services/public`, {
            headers: { Accept: 'application/json' },
        });
        if (!res.ok) throw new Error('services_fetch_failed');
        const raw: Service[] = await res.json();
        // /services/public returns every active service (isActive only). Show
        // only the curated public catalog — the same onlineBooking=true set the
        // booking wizard uses — so pre-Booksy legacy/duplicate services stay off
        // the marketing price list.
        const data = Array.isArray(raw)
            ? raw.filter((svc) => svc.onlineBooking !== false)
            : raw;
        if (!Array.isArray(data) || data.length === 0) {
            return { props: { categories: [] } };
        }
        const map = new Map<string, ServiceCategory>();
        for (const svc of data) {
            const categoryName = resolveCategoryName(svc);
            if (!map.has(categoryName)) {
                map.set(categoryName, {
                    id: null,
                    name: categoryName,
                    services: [],
                });
            }
            map.get(categoryName)!.services.push(svc);
        }
        const categories = Array.from(map.values());
        return {
            props: {
                categories,
            },
        };
    } catch {
        return { props: { categories: [] } };
    }
};
