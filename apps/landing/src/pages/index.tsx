import { useEffect, useState } from 'react';
import { GetStaticProps } from 'next';
import Head from 'next/head';
import Script from 'next/script';
import { jsonLd, absUrl } from '@/utils/seo';
import Link from 'next/link';
import PublicLayout from '@/components/PublicLayout';
import { trackEvent } from '@/utils/analytics';
import { BUSINESS_INFO, SEO_META } from '@/config/content';
import translations from '@/i18n/translations';
import { useLanguage } from '@/contexts/LanguageContext';
import SplitHero from '@/components/SplitHero';
import AboutSpread from '@/components/AboutSpread';
import SalonGallery from '@/components/SalonGallery';
import ServicesTeaser from '@/components/ServicesTeaser';
import Testimonials from '@/components/Testimonials';
import SectionHeader from '@/components/SectionHeader';
import BookingModal from '@/components/BookingModal';
import BookingCta from '@/components/BookingCta';
import MapFacade from '@/components/MapFacade';
import { useOpeningHours } from '@/hooks/useOpeningHours';
import { getFounderMessage, getSalonGallery } from '@/utils/contentApi';

type FounderData = { name: string; quote: string; photo?: string };
type GalleryImage = { id: number; image: string; caption: string; alt: string };

interface HomePageProps {
    founder: FounderData;
    galleryImages: GalleryImage[];
}

export default function HomePage({ founder, galleryImages }: HomePageProps) {
    const { T } = useLanguage();
    const { lines: openingHours } = useOpeningHours();
    const c = T.contact;

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
            </Head>
            <Script
                id="ld-localbusiness"
                type="application/ld+json"
                strategy="afterInteractive"
            >
                {jsonLd({
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
                        reviewCount: translations.pl.testimonials.items.length,
                    },
                    review: translations.pl.testimonials.items.map((r) => ({
                        '@type': 'Review',
                        author: { '@type': 'Person', name: r.name },
                        reviewBody: r.text,
                        reviewRating: {
                            '@type': 'Rating',
                            ratingValue: '5',
                            bestRating: '5',
                        },
                    })),
                    // Real schedule (follows the owner-employee's timetable):
                    // Mon+Fri 09–16, Tue+Thu 12–19, Sat 09–13, Wed+Sun closed.
                    openingHoursSpecification: [
                        {
                            '@type': 'OpeningHoursSpecification',
                            dayOfWeek: ['Monday', 'Friday'],
                            opens: '09:00',
                            closes: '16:00',
                        },
                        {
                            '@type': 'OpeningHoursSpecification',
                            dayOfWeek: ['Tuesday', 'Thursday'],
                            opens: '12:00',
                            closes: '19:00',
                        },
                        {
                            '@type': 'OpeningHoursSpecification',
                            dayOfWeek: 'Saturday',
                            opens: '09:00',
                            closes: '13:00',
                        },
                    ],
                })}
            </Script>

            <div>
                {/* 1. Split hero */}
                <SplitHero />

                {/* 2. Services */}
                <ServicesTeaser />

                {/* 3. About — short founder note */}
                <div id="about" className="reveal-item">
                    <AboutSpread founder={founder} />
                </div>

                {/* 4. Gallery */}
                <SalonGallery images={galleryImages} />

                {/* 5. Testimonials (client voice, paired with gallery) */}
                <Testimonials />

                {/* 6. Booking CTA */}
                <BookingCta />

                {/* 7. Contact */}
                <section
                    className="contact-section"
                    style={{ background: 'var(--brand-black)' }}
                >
                    <div
                        className="container mx-auto px-4 md:px-8"
                        style={{ paddingTop: '5rem', paddingBottom: '5rem' }}
                    >
                        <SectionHeader
                            eyebrow={c.findUs}
                            title={c.title}
                            dark
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 max-w-5xl mx-auto">
                            <div className="space-y-8">
                                <a
                                    href={`tel:${BUSINESS_INFO.contact.phone.replace(/\s/g, '')}`}
                                    className="block group"
                                >
                                    <span
                                        className="text-xs uppercase block mb-1"
                                        style={{
                                            color: 'rgba(255,255,255,0.6)',
                                            letterSpacing: '0.12em',
                                        }}
                                    >
                                        {c.phoneLabel}
                                    </span>
                                    <span
                                        className="block transition-opacity duration-200 group-hover:opacity-70"
                                        style={{
                                            fontFamily:
                                                'var(--font-playfair), serif',
                                            fontSize:
                                                'clamp(1.8rem, 4vw, 2.6rem)',
                                            color: '#ffffff',
                                            letterSpacing: '-0.01em',
                                        }}
                                    >
                                        {BUSINESS_INFO.contact.phone}
                                    </span>
                                </a>

                                <a
                                    href={`mailto:${BUSINESS_INFO.contact.email}`}
                                    className="block group"
                                >
                                    <span
                                        className="text-xs uppercase block mb-1"
                                        style={{
                                            color: 'rgba(255,255,255,0.6)',
                                            letterSpacing: '0.12em',
                                        }}
                                    >
                                        {c.emailLabel}
                                    </span>
                                    <span
                                        className="block transition-opacity duration-200 group-hover:opacity-70"
                                        style={{
                                            color: '#ffffff',
                                            fontSize: '1.05rem',
                                            letterSpacing: '0.01em',
                                            wordBreak: 'break-word',
                                            fontFamily:
                                                'var(--font-open-sans), sans-serif',
                                        }}
                                    >
                                        {BUSINESS_INFO.contact.email}
                                    </span>
                                </a>

                                <div>
                                    <span
                                        className="text-xs uppercase block mb-2"
                                        style={{
                                            color: 'rgba(255,255,255,0.6)',
                                            letterSpacing: '0.12em',
                                        }}
                                    >
                                        {c.addressLabel}
                                    </span>
                                    <address
                                        className="not-italic"
                                        style={{
                                            color: 'rgba(255,255,255,0.7)',
                                            lineHeight: 1.8,
                                        }}
                                    >
                                        {BUSINESS_INFO.address.street}
                                        <br />
                                        {BUSINESS_INFO.address.postalCode}{' '}
                                        {BUSINESS_INFO.address.city}
                                    </address>
                                </div>

                                <div>
                                    <span
                                        className="text-xs uppercase block mb-3"
                                        style={{
                                            color: 'rgba(255,255,255,0.6)',
                                            letterSpacing: '0.12em',
                                        }}
                                    >
                                        {c.hoursTitle}
                                    </span>
                                    <div>
                                        {[
                                            ...openingHours.map((line) => ({
                                                day: line.label,
                                                hours: line.value,
                                                closed: !!line.closed,
                                            })),
                                            {
                                                day: c.daySun,
                                                hours: T.footer.sunday,
                                                closed: true,
                                            },
                                        ].map(({ day, hours, closed }) => (
                                            <div
                                                key={day}
                                                className="flex justify-between items-center py-1.5"
                                                style={{
                                                    borderBottom:
                                                        '1px solid rgba(255,255,255,0.06)',
                                                }}
                                            >
                                                <span
                                                    className="text-sm"
                                                    style={{
                                                        color: 'rgba(255,255,255,0.5)',
                                                    }}
                                                >
                                                    {day}
                                                </span>
                                                <span
                                                    className="text-sm font-medium"
                                                    style={{
                                                        color: closed
                                                            ? 'rgba(255,255,255,0.55)'
                                                            : 'var(--brand-silver)',
                                                    }}
                                                >
                                                    {hours}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Booking entry lives in hero / CTA band / FAB —
                                    contact section offers phone + form instead */}
                                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                    <Link
                                        href="/contact"
                                        className="split-hero__cta-secondary text-xs font-semibold uppercase text-center px-8 py-3.5"
                                        style={{ letterSpacing: '0.14em' }}
                                    >
                                        {c.formLink}
                                    </Link>
                                </div>
                            </div>

                            <div className="relative min-h-[380px]">
                                <div
                                    className="absolute"
                                    style={{
                                        inset: 0,
                                        border: '1px solid rgba(180,184,190,0.25)',
                                        borderRadius: '3px',
                                        transform: 'translate(8px, 8px)',
                                        zIndex: 0,
                                    }}
                                />
                                <MapFacade height={380} grayscale={0.3} fill />
                            </div>
                        </div>
                    </div>
                </section>
            </div>
            <BookingModal
                open={bookingModalOpen}
                onClose={() => setBookingModalOpen(false)}
            />
        </PublicLayout>
    );
}

export const getStaticProps: GetStaticProps<HomePageProps> = async () => {
    const [founder, galleryImages] = await Promise.all([
        getFounderMessage(),
        getSalonGallery(),
    ]);

    return {
        props: {
            founder: founder as unknown as FounderData,
            galleryImages: galleryImages as unknown as GalleryImage[],
        },
        revalidate: 3600,
    };
};
