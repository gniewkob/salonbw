import Head from 'next/head';
import Link from 'next/link';
import Script from 'next/script';
import { useState, useEffect } from 'react';
import PublicLayout from '@/components/PublicLayout';
import BookingModal from '@/components/BookingModal';
import { BUSINESS_INFO } from '@/config/content';
import { jsonLd, absUrl } from '@/utils/seo';
import { trackEvent } from '@/utils/analytics';
import { useLanguage } from '@/contexts/LanguageContext';

const ITEMS = [
    'Koloryzacja jednolita i wielotonowa',
    'Korekta koloru (color correction)',
    'Farbowanie korzeni i odrostów',
    'Toning i gloss',
    'Bezpieczna dla włosów – bez amoniaku dostępne',
];

export default function ColoringPage() {
    const [open, setOpen] = useState(false);
    const { T } = useLanguage();
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
                <title>Koloryzacja Bytom — Salon Black &amp; White</title>
                <meta name="description" content="Profesjonalna koloryzacja włosów w Bytomiu — farby Wella i Kerastase, color correction, toning. Salon Black & White, ul. Webera 1a/13." />
                <meta name="keywords" content="koloryzacja włosów bytom, color correction bytom, farbowanie włosów bytom, toning włosów, salon fryzjerski bytom" />
                <meta property="og:title" content="Koloryzacja włosów — Salon Black & White Bytom" />
                <meta property="og:description" content="Profesjonalna koloryzacja włosów w Bytomiu. Farby Wella i Kerastase, color correction, toning, farbowanie odrostów." />
                <meta property="og:image" content={absUrl('/images/hero/slider1.jpg')} />
                <meta property="og:type" content="website" />
                <link rel="canonical" href={absUrl('/services/coloring')} />
                <meta name="robots" content="index, follow" />
            </Head>

            <Script
                id="ld-service-coloring"
                type="application/ld+json"
                strategy="afterInteractive"
            >
                {jsonLd({
                    '@context': 'https://schema.org',
                    '@type': 'Service',
                    name: 'Koloryzacja',
                    description:
                        'Pełna koloryzacja włosów z użyciem profesjonalnych farb Wella i Kerastase. Korekta koloru, toning, farbowanie odrostów.',
                    category: 'Usługi fryzjerskie',
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
                    url: absUrl('/services/coloring'),
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
                        Usługi fryzjerskie
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
                        Koloryzacja
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
                        Pełna koloryzacja to kompletna zmiana lub odświeżenie koloru
                        włosów. Używamy wyłącznie profesjonalnych farb Wella i
                        Kerastase, które zapewniają intensywny kolor i pielęgnację
                        jednocześnie.
                    </p>
                    <button
                        onClick={() => {
                            try {
                                trackEvent('select_item', {
                                    items: [{ item_id: 'coloring', item_name: 'Koloryzacja', item_category: 'Usługi fryzjerskie' }],
                                });
                                trackEvent('begin_checkout', {
                                    items: [{ item_id: 'coloring', item_name: 'Koloryzacja', item_category: 'Usługi fryzjerskie' }],
                                    cta: 'service_page',
                                });
                            } catch {}
                            setOpen(true);
                        }}
                        className="split-hero__cta-primary"
                        data-testid="coloring-cta"
                    >
                        {T.nav.booking}
                    </button>
                </div>
            </section>

            {/* Light content section */}
            <section style={{ background: '#faf9f7', padding: '5rem 2rem' }}>
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
                                    borderBottom: '1px solid #ede9e3',
                                    fontFamily: 'var(--font-open-sans), sans-serif',
                                    color: '#3a3028',
                                    fontSize: '0.95rem',
                                }}
                            >
                                <span
                                    style={{ color: '#b4b8be', flexShrink: 0 }}
                                >
                                    —
                                </span>
                                {item}
                            </li>
                        ))}
                    </ul>

                    <div style={{ marginTop: '3rem' }}>
                        <Link
                            href="/services"
                            style={{
                                color: '#b4b8be',
                                fontSize: '0.8rem',
                                letterSpacing: '0.12em',
                                textTransform: 'uppercase',
                                textDecoration: 'none',
                                fontFamily: 'var(--font-open-sans), sans-serif',
                            }}
                        >
                            ← Pełna oferta i cennik
                        </Link>
                    </div>
                </div>
            </section>

            <BookingModal open={open} onClose={() => setOpen(false)} />
        </PublicLayout>
    );
}
