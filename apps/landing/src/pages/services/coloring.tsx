import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { ChevronLeftIcon, MinusSmallIcon } from '@heroicons/react/20/solid';
import PublicLayout from '@/components/PublicLayout';
import BookingModal from '@/components/BookingModal';
import PageHero from '@/components/page/PageHero';
import { BUSINESS_INFO } from '@/config/content';
import { jsonLd, absUrl } from '@/utils/seo';
import { trackEvent } from '@/utils/analytics';
import { useLanguage } from '@/contexts/LanguageContext';
import { SERVICE_DETAIL, OG_LOCALE } from '@/i18n/serviceDetail';

export default function ColoringPage() {
    const [open, setOpen] = useState(false);
    const { T, lang } = useLanguage();
    const sd = SERVICE_DETAIL[lang];
    const c = sd.coloring;
    const name = BUSINESS_INFO.name;

    useEffect(() => {
        try {
            trackEvent('view_item', {
                items: [
                    {
                        item_id: 'coloring',
                        item_name: 'Koloryzacja',
                        item_category: 'Usługi fryzjerskie',
                    },
                ],
            });
        } catch {}
    }, []);

    return (
        <PublicLayout>
            <Head>
                <title>{c.metaTitle}</title>
                <meta name="description" content={c.metaDescription} />
                <meta name="keywords" content={c.keywords} />
                <meta property="og:title" content={c.ogTitle} />
                <meta property="og:description" content={c.ogDescription} />
                <meta
                    property="og:image"
                    content={absUrl('/images/hero/slider1.jpg')}
                />
                <meta property="og:image:width" content="1200" />
                <meta property="og:image:height" content="630" />
                <meta property="og:type" content="website" />
                <meta property="og:locale" content={OG_LOCALE[lang]} />
                <meta
                    property="og:url"
                    content={absUrl('/services/coloring')}
                />
                <link rel="canonical" href={absUrl('/services/coloring')} />
                <meta name="robots" content="index, follow" />
                {/* Rendered server-side: crawlers that do not execute
                    JavaScript (and link previews) must see the schema. */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: jsonLd({
                            '@context': 'https://schema.org',
                            '@type': 'Service',
                            name: c.ldName,
                            description: c.ldDescription,
                            category: 'Usługi fryzjerskie',
                            provider: {
                                '@type': 'LocalBusiness',
                                name,
                                address: {
                                    '@type': 'PostalAddress',
                                    streetAddress: BUSINESS_INFO.address.street,
                                    addressLocality: BUSINESS_INFO.address.city,
                                    postalCode:
                                        BUSINESS_INFO.address.postalCode,
                                    addressCountry: 'PL',
                                },
                            },
                            areaServed: {
                                '@type': 'City',
                                name: 'Bytom',
                            },
                            url: absUrl('/services/coloring'),
                        }),
                    }}
                />
            </Head>

            <PageHero
                eyebrow={c.eyebrow}
                title={c.h1}
                lead={c.lead}
                stageBackground="var(--brand-warm-bg)"
                image={{ src: '/images/salon/salon4.jpg', alt: c.h1 }}
                actions={
                    <button
                        type="button"
                        onClick={() => {
                            try {
                                trackEvent('select_item', {
                                    items: [
                                        {
                                            item_id: 'coloring',
                                            item_name: 'Koloryzacja',
                                            item_category: 'Usługi fryzjerskie',
                                        },
                                    ],
                                });
                                trackEvent('begin_checkout', {
                                    items: [
                                        {
                                            item_id: 'coloring',
                                            item_name: 'Koloryzacja',
                                            item_category: 'Usługi fryzjerskie',
                                        },
                                    ],
                                    cta: 'service_page',
                                });
                            } catch {}
                            setOpen(true);
                        }}
                        className="bw-btn bw-btn--primary"
                        data-booking-cta
                        data-testid="coloring-cta"
                    >
                        {T.nav.booking}
                    </button>
                }
            />

            {/* Light content section */}
            <section
                style={{
                    background: 'var(--brand-warm-bg)',
                    padding: '5rem var(--page-gutter)',
                }}
            >
                <div style={{ maxWidth: '900px' }}>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {c.items.map((item) => (
                            <li
                                key={item}
                                style={{
                                    display: 'flex',
                                    alignItems: 'baseline',
                                    gap: '0.75rem',
                                    padding: '0.85rem 0',
                                    borderBottom:
                                        '1px solid var(--brand-warm-border)',
                                    fontFamily:
                                        'var(--font-body)',
                                    color: 'var(--brand-warm-ink)',
                                    fontSize: 'var(--text-body)',
                                }}
                            >
                                <MinusSmallIcon
                                    aria-hidden="true"
                                    style={{
                                        color: 'var(--brand-silver)',
                                        flexShrink: 0,
                                        width: 16,
                                        height: 16,
                                        alignSelf: 'center',
                                    }}
                                />
                                {item}
                            </li>
                        ))}
                    </ul>

                    <div style={{ marginTop: '3rem' }}>
                        <Link
                            href="/services"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                minHeight: '44px',
                                gap: '0.4rem',
                                color: '#4a4a4a',
                                fontSize: 'var(--text-small)',
                                letterSpacing: '0.12em',
                                textTransform: 'uppercase',
                                textDecoration: 'none',
                                fontFamily: 'var(--font-body)',
                            }}
                        >
                            <ChevronLeftIcon
                                aria-hidden="true"
                                style={{ width: 14, height: 14 }}
                            />
                            {sd.backToOffer}
                        </Link>
                    </div>
                </div>
            </section>

            <BookingModal open={open} onClose={() => setOpen(false)} />
        </PublicLayout>
    );
}
