import Head from 'next/head';
import { useState, useEffect } from 'react';
import PublicLayout from '@/components/PublicLayout';
import BookingModal from '@/components/BookingModal';
import PageHero from '@/components/page/PageHero';
import ServiceDetailBody from '@/components/page/ServiceDetailBody';
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

            <ServiceDetailBody
                entry={c}
                labels={sd}
                works={[
                    {
                        src: '/images/work/chlodny-blond-bob.jpg',
                        alt: 'Bob w chłodnym odcieniu blond',
                    },
                    {
                        src: '/images/work/polysk.jpg',
                        alt: 'Lśniące włosy po koloryzacji',
                    },
                    {
                        src: '/images/work/blond-prosty.jpg',
                        alt: 'Proste włosy w jasnym blondzie',
                    },
                ]}
                onBook={() => setOpen(true)}
            />

            <BookingModal open={open} onClose={() => setOpen(false)} />
        </PublicLayout>
    );
}
