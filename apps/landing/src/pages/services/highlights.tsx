import Head from 'next/head';
import Link from 'next/link';
import Script from 'next/script';
import { useState, useEffect } from 'react';
import { ChevronLeftIcon, MinusSmallIcon } from '@heroicons/react/20/solid';
import PublicLayout from '@/components/PublicLayout';
import BookingModal from '@/components/BookingModal';
import { BUSINESS_INFO } from '@/config/content';
import { jsonLd, absUrl } from '@/utils/seo';
import { trackEvent } from '@/utils/analytics';
import { useLanguage } from '@/contexts/LanguageContext';

const ITEMS = [
    'Pasemka klasyczne i dynamiczne',
    'Efekt rozświetlenia i głębi',
    'Dostosowane do odcienia bazowego',
    'Możliwość łączenia z balayage',
    'Niska ingerencja w strukturę włosa',
];

export default function HighlightsPage() {
    const [open, setOpen] = useState(false);
    const { T } = useLanguage();
    const name = BUSINESS_INFO.name;

    useEffect(() => {
        try {
            trackEvent('view_item', {
                items: [
                    {
                        item_id: 'highlights',
                        item_name: 'Pasemka',
                        item_category: 'Koloryzacja',
                    },
                ],
            });
        } catch {}
    }, []);

    return (
        <PublicLayout>
            <Head>
                <title>Pasemka Bytom — Salon Black &amp; White</title>
                <meta
                    name="description"
                    content="Pasemka i rozjaśnienia w Bytomiu — klasyczne i dynamiczne efekty głębi i blasku. Salon Black & White, ul. Webera 1a/13."
                />
                <meta
                    name="keywords"
                    content="pasemka bytom, rozjaśnienia włosów bytom, highlights bytom, klasyczne pasemka bytom, salon fryzjerski bytom"
                />
                <meta
                    property="og:title"
                    content="Pasemka — Salon Black & White Bytom"
                />
                <meta
                    property="og:description"
                    content="Pasemka i rozjaśnienia w Bytomiu — klasyczne i dynamiczne efekty głębi i blasku dla Twoich włosów."
                />
                <meta
                    property="og:image"
                    content={absUrl('/images/hero/slider1.jpg')}
                />
                <meta property="og:image:width" content="1200" />
                <meta property="og:image:height" content="630" />
                <meta property="og:type" content="website" />
                <meta property="og:locale" content="pl_PL" />
                <meta
                    property="og:url"
                    content={absUrl('/services/highlights')}
                />
                <link rel="canonical" href={absUrl('/services/highlights')} />
                <meta name="robots" content="index, follow" />
            </Head>

            <Script
                id="ld-service-highlights"
                type="application/ld+json"
                strategy="afterInteractive"
            >
                {jsonLd({
                    '@context': 'https://schema.org',
                    '@type': 'Service',
                    name: 'Pasemka',
                    description:
                        'Klasyczne pasemka i rozjaśnienia dodające głębi i blasku. Delikatne naturalne akcenty lub wyraziste kontrastowe efekty.',
                    category: 'Koloryzacja',
                    provider: {
                        '@type': 'LocalBusiness',
                        name,
                        address: {
                            '@type': 'PostalAddress',
                            streetAddress: BUSINESS_INFO.address.street,
                            addressLocality: BUSINESS_INFO.address.city,
                            postalCode: BUSINESS_INFO.address.postalCode,
                            addressCountry: 'PL',
                        },
                    },
                    areaServed: {
                        '@type': 'City',
                        name: 'Bytom',
                    },
                    url: absUrl('/services/highlights'),
                })}
            </Script>

            {/* Dark hero */}
            <section
                style={{
                    background: '#0d0d0d',
                    paddingTop: '7rem',
                    paddingBottom: '5rem',
                }}
            >
                <div
                    style={{
                        maxWidth: '900px',
                        margin: '0 auto',
                        padding: '0 2rem',
                    }}
                >
                    <p
                        style={{
                            color: '#b4b8be',
                            fontSize: '0.7rem',
                            letterSpacing: '0.2em',
                            textTransform: 'uppercase',
                            marginBottom: '1rem',
                            fontFamily: 'var(--font-open-sans), sans-serif',
                        }}
                    >
                        Koloryzacja
                    </p>
                    <h1
                        style={{
                            fontFamily: 'var(--font-playfair), serif',
                            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                            color: '#fff',
                            marginBottom: '1.5rem',
                            fontWeight: 700,
                            lineHeight: 1.1,
                        }}
                    >
                        Pasemka
                    </h1>
                    <p
                        style={{
                            color: 'rgba(255,255,255,0.65)',
                            fontSize: '1.05rem',
                            lineHeight: 1.8,
                            maxWidth: '600px',
                            marginBottom: '2.5rem',
                            fontFamily: 'var(--font-open-sans), sans-serif',
                        }}
                    >
                        Klasyczne pasemka i rozjaśnienia to najszybszy sposób na
                        dodanie głębi i blasku. Pracujemy zarówno z delikatnymi,
                        naturalnymi akcentami, jak i wyrazistymi, kontrastowymi
                        efektami.
                    </p>
                    <button
                        type="button"
                        onClick={() => {
                            try {
                                trackEvent('select_item', {
                                    items: [
                                        {
                                            item_id: 'highlights',
                                            item_name: 'Pasemka',
                                            item_category: 'Koloryzacja',
                                        },
                                    ],
                                });
                            } catch {}
                            setOpen(true);
                        }}
                        className="split-hero__cta-primary"
                    >
                        {T.nav.booking}
                    </button>
                </div>
            </section>

            {/* Light content section */}
            <section
                style={{
                    background: 'var(--brand-warm-bg)',
                    padding: '5rem 2rem',
                }}
            >
                <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {ITEMS.map((item) => (
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
                                        'var(--font-open-sans), sans-serif',
                                    color: 'var(--brand-warm-ink)',
                                    fontSize: '0.95rem',
                                }}
                            >
                                <MinusSmallIcon
                                    aria-hidden="true"
                                    style={{
                                        color: '#b4b8be',
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
                                gap: '0.4rem',
                                color: '#4a4a4a',
                                fontSize: '0.8rem',
                                letterSpacing: '0.12em',
                                textTransform: 'uppercase',
                                textDecoration: 'none',
                                fontFamily: 'var(--font-open-sans), sans-serif',
                            }}
                        >
                            <ChevronLeftIcon
                                aria-hidden="true"
                                style={{ width: 14, height: 14 }}
                            />
                            Pełna oferta i cennik
                        </Link>
                    </div>
                </div>
            </section>

            <BookingModal open={open} onClose={() => setOpen(false)} />
        </PublicLayout>
    );
}
