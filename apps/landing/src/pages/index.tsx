import { useEffect, useState } from 'react';
import { GetStaticProps } from 'next';
import Head from 'next/head';
import { jsonLd, absUrl } from '@/utils/seo';
import PublicLayout from '@/components/PublicLayout';
import { trackEvent } from '@/utils/analytics';
import { BUSINESS_INFO, SEO_META } from '@/config/content';
import { pl as plTranslations } from '@/i18n/translations';
import SalonGallery from '@/components/SalonGallery';
import Testimonials from '@/components/Testimonials';
import BookingModal from '@/components/BookingModal';
import MapFacade from '@/components/MapFacade';
import {
    HomeAtelier,
    HomeContact,
    HomeFounder,
    HomeHero,
    HomeServices,
} from '@/components/home/BlackWhiteHome';
import { useOpeningHours } from '@/hooks/useOpeningHours';
import { getFounderMessage, getOpeningHours } from '@/utils/contentApi';
import type { WeeklyHours } from '@/utils/openingHours';

type FounderData = { name: string; quote: string; photo?: string };

interface HomePageProps {
    founder: FounderData;
    openingHours?: WeeklyHours | null;
}

export default function HomePage({
    founder,
    openingHours: initialHours,
}: HomePageProps) {
    const {
        hours: weeklyHours,
        lines: openingHours,
        specification,
    } = useOpeningHours(initialHours);

    useEffect(() => {
        try {
            trackEvent('page_view', { page_title: 'Home' });
        } catch {}
    }, []);

    const [bookingModalOpen, setBookingModalOpen] = useState(false);

    return (
        <PublicLayout>
            <Head>
                <title>{SEO_META.title}</title>
                <meta name="description" content={SEO_META.description} />
                <meta name="keywords" content={SEO_META.keywords} />
                <meta name="author" content={SEO_META.author} />
                <meta property="og:title" content={SEO_META.title} />
                <meta
                    property="og:description"
                    content={SEO_META.description}
                />
                <meta property="og:type" content="website" />
                <meta
                    property="og:image"
                    content={absUrl('/images/hero/slider1.jpg')}
                />
                <meta property="og:image:width" content="1200" />
                <meta property="og:image:height" content="630" />
                <meta property="og:locale" content="pl_PL" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta
                    name="twitter:image"
                    content={absUrl('/images/hero/slider1.jpg')}
                />
                <link rel="canonical" href={absUrl('/')} />
                <meta name="robots" content="index, follow" />
                <meta name="geo.region" content={SEO_META.geo.region} />
                <meta name="geo.placename" content={SEO_META.geo.placename} />
                <meta name="geo.position" content={SEO_META.geo.position} />
                <meta name="ICBM" content={SEO_META.geo.icbm} />
                {/* Rendered server-side: crawlers that do not execute
                    JavaScript (and link previews) must see the schema. */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: jsonLd({
                            '@context': 'https://schema.org',
                            '@type': 'HairSalon',
                            name: BUSINESS_INFO.name,
                            url: process.env.NEXT_PUBLIC_SITE_URL || undefined,
                            image: absUrl('/assets/img/slider/slider1.jpg'),
                            description: SEO_META.description,
                            address: {
                                '@type': 'PostalAddress',
                                streetAddress: BUSINESS_INFO.address.street,
                                addressLocality: BUSINESS_INFO.address.city,
                                postalCode: BUSINESS_INFO.address.postalCode,
                                addressCountry: SEO_META.geo.country,
                            },
                            geo: {
                                '@type': 'GeoCoordinates',
                                latitude: BUSINESS_INFO.coordinates.lat,
                                longitude: BUSINESS_INFO.coordinates.lng,
                            },
                            telephone: BUSINESS_INFO.contact.phone,
                            // Rating data sourced from the testimonials VISIBLE on
                            // this page (Google requires on-page evidence); every
                            // published review is 5-star.
                            aggregateRating: {
                                '@type': 'AggregateRating',
                                ratingValue: '5.0',
                                bestRating: '5',
                                reviewCount:
                                    plTranslations.testimonials.items.length,
                            },
                            review: plTranslations.testimonials.items.map(
                                (r) => ({
                                    '@type': 'Review',
                                    author: { '@type': 'Person', name: r.name },
                                    reviewBody: r.text,
                                    reviewRating: {
                                        '@type': 'Rating',
                                        ratingValue: '5',
                                        bestRating: '5',
                                    },
                                }),
                            ),
                            openingHoursSpecification: specification,
                        }),
                    }}
                />
            </Head>

            <div>
                {/* 1–2. Cinematic hero + facts strip */}
                <HomeHero
                    onBook={() => setBookingModalOpen(true)}
                    hours={openingHours}
                    weekly={weeklyHours}
                />

                {/* 3. Atelier chapter */}
                <HomeAtelier />

                {/* 4. Founder */}
                <HomeFounder
                    name={founder.name}
                    quote={founder.quote}
                    photo={founder.photo}
                />

                {/* 5. Services index */}
                <HomeServices />

                {/* 6. Gallery */}
                <SalonGallery />

                {/* 7. Testimonials — visible reviews back aggregateRating */}
                <Testimonials />

                {/* 8. Contact */}
                <HomeContact
                    onBook={() => setBookingModalOpen(true)}
                    hours={openingHours}
                    map={<MapFacade height={380} grayscale={0.3} fill />}
                />
            </div>
            <BookingModal
                open={bookingModalOpen}
                onClose={() => setBookingModalOpen(false)}
            />
        </PublicLayout>
    );
}

export const getStaticProps: GetStaticProps<HomePageProps> = async () => {
    const founder = (await getFounderMessage()) as unknown as FounderData;
    const openingHours = await getOpeningHours();

    return {
        props: {
            founder,
            openingHours,
        },
        revalidate: 60,
    };
};
