import { useEffect } from 'react';
import { GetStaticProps } from 'next';
import Head from 'next/head';
import Script from 'next/script';
import { jsonLd, absUrl } from '@/utils/seo';
import Link from 'next/link';
import PublicLayout from '@/components/PublicLayout';
import { trackEvent } from '@/utils/analytics';
import { BUSINESS_INFO, SEO_META } from '@/config/content';
import { getPanelUrl } from '@/utils/panelUrl';
import SplitHero from '@/components/SplitHero';
import TrustStrip from '@/components/TrustStrip';
import ScrollReveal from '@/components/ScrollReveal';
import AboutSpread from '@/components/AboutSpread';
import SalonGallery from '@/components/SalonGallery';
import ServicesTeaser from '@/components/ServicesTeaser';
import Testimonials from '@/components/Testimonials';
import SectionHeader from '@/components/SectionHeader';
import {
    getFounderMessage,
    getSalonGallery,
} from '@/utils/contentApi';

type FounderData = { name: string; quote: string; photo?: string };
type GalleryImage = { id: number; image: string; caption: string; alt: string };

interface HomePageProps {
    founder: FounderData;
    galleryImages: GalleryImage[];
}

export default function HomePage({ founder, galleryImages }: HomePageProps) {
    useEffect(() => {
        try { trackEvent('page_view', { page_title: 'Home' }); } catch {}
    }, []);

    const bookingUrl = getPanelUrl(`/auth/login?redirect=${encodeURIComponent('/appointments')}`);

    return (
        <PublicLayout>
            <Head>
                <title>{SEO_META.title}</title>
                <meta name="description" content={SEO_META.description} />
                <meta name="keywords" content={SEO_META.keywords} />
                <meta name="author" content={SEO_META.author} />
                <meta property="og:title" content={SEO_META.title} />
                <meta property="og:description" content={SEO_META.description} />
                <meta property="og:type" content="website" />
                <meta property="og:image" content={absUrl('/images/hero/slider1.jpg')} />
                <meta property="og:image:width" content="1200" />
                <meta property="og:image:height" content="630" />
                <meta property="og:locale" content="pl_PL" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:image" content={absUrl('/images/hero/slider1.jpg')} />
                <link rel="canonical" href={process.env.NEXT_PUBLIC_SITE_URL || 'https://salon-bw.pl'} />
                <meta name="robots" content="index, follow" />
                <meta name="geo.region" content={SEO_META.geo.region} />
                <meta name="geo.placename" content={SEO_META.geo.placename} />
                <meta name="geo.position" content={SEO_META.geo.position} />
                <meta name="ICBM" content={SEO_META.geo.icbm} />
            </Head>
            <Script id="ld-localbusiness" type="application/ld+json" strategy="afterInteractive">
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
                    openingHoursSpecification: [
                        { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday','Tuesday','Wednesday','Thursday','Friday'], opens: '10:00', closes: '19:00' },
                        { '@type': 'OpeningHoursSpecification', dayOfWeek: 'Saturday', opens: '09:00', closes: '15:00' },
                    ],
                })}
            </Script>

            <div>
                {/* 1. Split hero */}
                <SplitHero />

                {/* 2. Partner brands trust strip */}
                <TrustStrip />

                {/* 3. Services */}
                <ScrollReveal direction="up">
                    <ServicesTeaser />
                </ScrollReveal>

                {/* 4. About — founder + 3 principles */}
                <ScrollReveal direction="up">
                    <AboutSpread founder={founder} />
                </ScrollReveal>

                {/* 5. Gallery */}
                <SalonGallery images={galleryImages} />

                {/* 6. Testimonials */}
                <Testimonials />

                {/* 7. Contact */}
                <section className="contact-section" style={{ background: 'var(--brand-black)' }}>
                    <div className="container mx-auto px-4 md:px-8" style={{ paddingTop: '5rem', paddingBottom: '5rem' }}>
                        <SectionHeader eyebrow="Znajdź nas" title="Kontakt" dark />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 max-w-5xl mx-auto">
                            <div className="space-y-8">
                                <a href={`tel:${BUSINESS_INFO.contact.phone.replace(/\s/g, '')}`} className="block group">
                                    <span className="text-xs uppercase block mb-1" style={{ color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em' }}>Telefon</span>
                                    <span
                                        className="block transition-opacity duration-200 group-hover:opacity-70"
                                        style={{ fontFamily: "var(--font-playfair), serif", fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', color: '#ffffff', letterSpacing: '-0.01em' }}
                                    >
                                        {BUSINESS_INFO.contact.phone}
                                    </span>
                                </a>

                                <div>
                                    <span className="text-xs uppercase block mb-2" style={{ color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em' }}>Adres</span>
                                    <address className="not-italic" style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.8 }}>
                                        {BUSINESS_INFO.address.street}<br />
                                        {BUSINESS_INFO.address.postalCode} {BUSINESS_INFO.address.city}
                                    </address>
                                </div>

                                <div>
                                    <span className="text-xs uppercase block mb-3" style={{ color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em' }}>Godziny otwarcia</span>
                                    <div>
                                        {[
                                            { day: 'Poniedziałek – Piątek', hours: BUSINESS_INFO.hours.mondayFriday },
                                            { day: 'Sobota', hours: BUSINESS_INFO.hours.saturday },
                                            { day: 'Niedziela', hours: BUSINESS_INFO.hours.sunday },
                                        ].map(({ day, hours }) => (
                                            <div key={day} className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{day}</span>
                                                <span className="text-sm font-medium" style={{ color: hours === 'Zamknięte' ? 'rgba(255,255,255,0.25)' : 'var(--brand-gold)' }}>{hours}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                    <a
                                        href={bookingUrl}
                                        className="split-hero__cta-primary text-xs font-semibold uppercase text-center px-8 py-3.5"
                                        style={{ letterSpacing: '0.14em' }}
                                    >
                                        {BUSINESS_INFO.booking.text}
                                    </a>
                                    <Link
                                        href="/contact"
                                        className="split-hero__cta-secondary text-xs font-semibold uppercase text-center px-8 py-3.5"
                                        style={{ letterSpacing: '0.14em' }}
                                    >
                                        Formularz kontaktowy
                                    </Link>
                                </div>
                            </div>

                            <div className="relative self-start">
                                <div className="absolute" style={{ inset: 0, border: '1px solid rgba(197,168,128,0.25)', borderRadius: '3px', transform: 'translate(8px, 8px)', zIndex: 0 }} />
                                <iframe
                                    src={`https://maps.google.com/maps?q=${BUSINESS_INFO.coordinates.lat},${BUSINESS_INFO.coordinates.lng}&z=16&output=embed&hl=pl`}
                                    className="relative w-full"
                                    style={{ height: '380px', borderRadius: '3px', filter: 'grayscale(0.3) contrast(1.05)', zIndex: 1, display: 'block' }}
                                    allowFullScreen
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                    title={`Mapa salonu ${BUSINESS_INFO.name} w ${BUSINESS_INFO.address.city}`}
                                />
                            </div>
                        </div>
                    </div>
                </section>
            </div>
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
