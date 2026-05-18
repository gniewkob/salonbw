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
import HeroSlider from '@/components/HeroSlider';
import FounderMessage from '@/components/FounderMessage';
import HistoryAccordion from '@/components/HistoryAccordion';
import ValuesSection from '@/components/ValuesSection';
import SalonGallery from '@/components/SalonGallery';
import PartnerBrands from '@/components/PartnerBrands';
import ServicesTeaser from '@/components/ServicesTeaser';
import Testimonials from '@/components/Testimonials';
import {
    getHeroSlides,
    getFounderMessage,
    getHistoryItems,
    getCoreValues,
    getSalonGallery,
} from '@/utils/contentApi';

type HeroSlide = { id: number; title: string; description: string; image: string; alt: string };
type FounderData = { name: string; quote: string; photo?: string };
type HistoryItem = { id: string; title: string; content: string };
type CoreValue = { id: string; title: string; icon: string; description: string };
type GalleryImage = { id: number; image: string; caption: string; alt: string };

interface HomePageProps {
    slides: HeroSlide[];
    founder: FounderData;
    historyItems: HistoryItem[];
    coreValues: CoreValue[];
    galleryImages: GalleryImage[];
}

export default function HomePage({ slides, founder, historyItems, coreValues, galleryImages }: HomePageProps) {
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
                {/* 1. Full-height hero with Tangerine / Playfair */}
                <HeroSlider slides={slides} />

                {/* 2. Partner brands marquee */}
                <PartnerBrands />

                {/* 3. Services teaser — 3 cards */}
                <ServicesTeaser />

                {/* 4. Founder message — split layout */}
                <FounderMessage founder={founder} />

                {/* 5. History accordion */}
                <HistoryAccordion items={historyItems} />

                {/* 6. Core values — icon grid */}
                <ValuesSection values={coreValues} />

                {/* 7. Gallery — masonry */}
                <SalonGallery images={galleryImages} />

                {/* 8. Testimonials — dark section */}
                <Testimonials />

                {/* 9. Contact section — dark with gold accents */}
                <section style={{ background: '#0d0d0d' }} className="py-20 md:py-28">
                    <div className="container mx-auto px-4 md:px-8">
                        <div className="text-center mb-14">
                            <p className="text-xs tracking-widest uppercase mb-3" style={{ color: '#c5a880', letterSpacing: '0.22em', fontFamily: "'Open Sans', sans-serif" }}>
                                Znajdź nas
                            </p>
                            <h2 className="text-3xl md:text-4xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: '#ffffff' }}>
                                Kontakt
                            </h2>
                            <div className="mx-auto mt-4" style={{ width: '40px', height: '2px', background: '#c5a880' }} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 max-w-5xl mx-auto">
                            {/* Info */}
                            <div className="space-y-8">
                                {/* Big phone */}
                                <a
                                    href={`tel:${BUSINESS_INFO.contact.phone.replace(/\s/g, '')}`}
                                    className="block group"
                                >
                                    <span className="text-xs tracking-widest uppercase block mb-1" style={{ color: 'rgba(255,255,255,0.4)', letterSpacing: '0.2em' }}>Telefon</span>
                                    <span
                                        className="block transition-colors duration-200 group-hover:opacity-80"
                                        style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', color: '#ffffff', letterSpacing: '-0.01em' }}
                                    >
                                        {BUSINESS_INFO.contact.phone}
                                    </span>
                                </a>

                                <div>
                                    <span className="text-xs tracking-widest uppercase block mb-2" style={{ color: 'rgba(255,255,255,0.4)', letterSpacing: '0.2em' }}>Adres</span>
                                    <address className="not-italic" style={{ color: 'rgba(255,255,255,0.75)', lineHeight: 1.7 }}>
                                        {BUSINESS_INFO.address.street}<br />
                                        {BUSINESS_INFO.address.postalCode} {BUSINESS_INFO.address.city}
                                    </address>
                                </div>

                                <div>
                                    <span className="text-xs tracking-widest uppercase block mb-3" style={{ color: 'rgba(255,255,255,0.4)', letterSpacing: '0.2em' }}>Godziny otwarcia</span>
                                    <div className="space-y-1.5">
                                        {[
                                            { day: 'Poniedziałek – Piątek', hours: BUSINESS_INFO.hours.mondayFriday },
                                            { day: 'Sobota', hours: BUSINESS_INFO.hours.saturday },
                                            { day: 'Niedziela', hours: BUSINESS_INFO.hours.sunday },
                                        ].map(({ day, hours }) => (
                                            <div key={day} className="flex justify-between items-center py-1.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>{day}</span>
                                                <span className="text-sm font-medium" style={{ color: hours === 'Zamknięte' ? 'rgba(255,255,255,0.3)' : '#c5a880' }}>{hours}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                    <a
                                        href={bookingUrl}
                                        className="px-8 py-3.5 text-xs font-semibold tracking-widest uppercase text-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#c5a880]"
                                        style={{ background: '#c5a880', color: '#fff', borderRadius: '2px', letterSpacing: '0.14em' }}
                                        onMouseEnter={e => (e.currentTarget.style.background = '#a8895f')}
                                        onMouseLeave={e => (e.currentTarget.style.background = '#c5a880')}
                                    >
                                        {BUSINESS_INFO.booking.text}
                                    </a>
                                    <Link
                                        href="/contact"
                                        className="px-8 py-3.5 text-xs font-semibold tracking-widest uppercase text-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#c5a880]"
                                        style={{ border: '1px solid rgba(255,255,255,0.25)', color: 'rgba(255,255,255,0.8)', borderRadius: '2px', letterSpacing: '0.14em' }}
                                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                                    >
                                        Formularz kontaktowy
                                    </Link>
                                </div>
                            </div>

                            {/* Map */}
                            <div className="relative">
                                <div
                                    className="absolute inset-0 -m-2 rounded"
                                    style={{ border: '1px solid rgba(197,168,128,0.3)', borderRadius: '3px', transform: 'translate(6px, 6px)', zIndex: 0 }}
                                />
                                <iframe
                                    src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2549.${BUSINESS_INFO.coordinates.lat}!2d${BUSINESS_INFO.coordinates.lng}!3d${BUSINESS_INFO.coordinates.lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNTDCsDIwJzU1LjEiTiAxOMKwNTUnMTcuMSJF!5e0!3m2!1spl!2spl!4v1234567890123!5m2!1spl!2spl`}
                                    className="relative w-full"
                                    style={{ height: '380px', borderRadius: '3px', filter: 'grayscale(0.2) contrast(1.05)', zIndex: 1 }}
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
    const [slides, founder, historyItems, coreValues, galleryImages] = await Promise.all([
        getHeroSlides(),
        getFounderMessage(),
        getHistoryItems(),
        getCoreValues(),
        getSalonGallery(),
    ]);

    return {
        props: {
            slides: slides as unknown as HeroSlide[],
            founder: founder as unknown as FounderData,
            historyItems: historyItems as unknown as HistoryItem[],
            coreValues: coreValues as unknown as CoreValue[],
            galleryImages: galleryImages as unknown as GalleryImage[],
        },
        revalidate: 3600,
    };
};
