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
import GoldTicker from '@/components/GoldTicker';
import StatsBar from '@/components/StatsBar';
import CustomCursor from '@/components/CustomCursor';
import ScrollReveal from '@/components/ScrollReveal';
import FounderMessage from '@/components/FounderMessage';
import HistoryAccordion from '@/components/HistoryAccordion';
import ValuesSection from '@/components/ValuesSection';
import SalonGallery from '@/components/SalonGallery';
import PartnerBrands from '@/components/PartnerBrands';
import ServicesTeaser from '@/components/ServicesTeaser';
import Testimonials from '@/components/Testimonials';
import SectionHeader from '@/components/SectionHeader';
import {
    getFounderMessage,
    getHistoryItems,
    getCoreValues,
    getSalonGallery,
} from '@/utils/contentApi';

type FounderData = { name: string; quote: string; photo?: string };
type HistoryItem = { id: string; title: string; content: string };
type CoreValue = { id: string; title: string; icon: string; description: string };
type GalleryImage = { id: number; image: string; caption: string; alt: string };

interface HomePageProps {
    founder: FounderData;
    historyItems: HistoryItem[];
    coreValues: CoreValue[];
    galleryImages: GalleryImage[];
}

export default function HomePage({ founder, historyItems, coreValues, galleryImages }: HomePageProps) {
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
                <CustomCursor />

                {/* 1. Diagonal split hero */}
                <SplitHero />

                {/* 2. Gold ticker — scrolling brand strip */}
                <GoldTicker />

                {/* 3. Partner brands marquee */}
                <PartnerBrands />

                {/* 4. Stats bar */}
                <StatsBar />

                {/* 5. Services teaser */}
                <ScrollReveal direction="up">
                    <ServicesTeaser />
                </ScrollReveal>

                {/* 6. Founder message */}
                <ScrollReveal direction="up">
                    <FounderMessage founder={founder} />
                </ScrollReveal>

                {/* 7. Core values */}
                <ScrollReveal direction="up">
                    <ValuesSection values={coreValues} />
                </ScrollReveal>

                {/* 8. Gallery */}
                <ScrollReveal direction="up">
                    <SalonGallery images={galleryImages} />
                </ScrollReveal>

                {/* 9. History */}
                <ScrollReveal direction="up">
                    <HistoryAccordion items={historyItems} />
                </ScrollReveal>

                {/* 10. Testimonials */}
                <ScrollReveal direction="up">
                    <Testimonials />
                </ScrollReveal>

                {/* 11. Contact — ink black, gold accents */}
                <section className="contact-section" style={{ background: 'var(--brand-black)' }}>
                    <div className="container mx-auto px-4 md:px-8" style={{ paddingTop: '5rem', paddingBottom: '5rem' }}>
                        <ScrollReveal direction="up">
                            <SectionHeader eyebrow="Znajdź nas" title="Kontakt" dark />
                        </ScrollReveal>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 max-w-5xl mx-auto">
                            <ScrollReveal direction="left">
                                <div className="space-y-8">
                                    <a href={`tel:${BUSINESS_INFO.contact.phone.replace(/\s/g, '')}`} className="block group">
                                        <span className="text-xs uppercase block mb-1" style={{ color: 'rgba(255,255,255,0.35)', letterSpacing: '0.22em' }}>Telefon</span>
                                        <span className="block transition-opacity duration-200 group-hover:opacity-70"
                                            style={{ fontFamily: "var(--font-playfair), serif", fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', color: '#ffffff', letterSpacing: '-0.01em' }}>
                                            {BUSINESS_INFO.contact.phone}
                                        </span>
                                    </a>

                                    <div>
                                        <span className="text-xs uppercase block mb-2" style={{ color: 'rgba(255,255,255,0.35)', letterSpacing: '0.22em' }}>Adres</span>
                                        <address className="not-italic" style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.8 }}>
                                            {BUSINESS_INFO.address.street}<br />
                                            {BUSINESS_INFO.address.postalCode} {BUSINESS_INFO.address.city}
                                        </address>
                                    </div>

                                    <div>
                                        <span className="text-xs uppercase block mb-3" style={{ color: 'rgba(255,255,255,0.35)', letterSpacing: '0.22em' }}>Godziny otwarcia</span>
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
                                        <a href={bookingUrl}
                                            className="split-hero__cta-primary text-xs font-semibold uppercase text-center px-8 py-3.5"
                                            style={{ letterSpacing: '0.14em' }}>
                                            {BUSINESS_INFO.booking.text}
                                        </a>
                                        <Link href="/contact"
                                            className="split-hero__cta-secondary text-xs font-semibold uppercase text-center px-8 py-3.5"
                                            style={{ letterSpacing: '0.14em' }}>
                                            Formularz kontaktowy
                                        </Link>
                                    </div>
                                </div>
                            </ScrollReveal>

                            <ScrollReveal direction="right">
                                <div className="relative">
                                    <div className="absolute" style={{ inset: 0, margin: '-8px', border: '1px solid rgba(197,168,128,0.25)', borderRadius: '3px', transform: 'translate(8px, 8px)', zIndex: 0 }} />
                                    <iframe
                                        src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2549.${BUSINESS_INFO.coordinates.lat}!2d${BUSINESS_INFO.coordinates.lng}!3d${BUSINESS_INFO.coordinates.lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNTDCsDIwJzU1LjEiTiAxOMKwNTUnMTcuMSJF!5e0!3m2!1spl!2spl!4v1234567890123!5m2!1spl!2spl`}
                                        className="relative w-full"
                                        style={{ height: '380px', borderRadius: '3px', filter: 'grayscale(0.3) contrast(1.05)', zIndex: 1, display: 'block' }}
                                        allowFullScreen
                                        loading="lazy"
                                        referrerPolicy="no-referrer-when-downgrade"
                                        title={`Mapa salonu ${BUSINESS_INFO.name} w ${BUSINESS_INFO.address.city}`}
                                    />
                                </div>
                            </ScrollReveal>
                        </div>
                    </div>
                </section>
            </div>
        </PublicLayout>
    );
}

export const getStaticProps: GetStaticProps<HomePageProps> = async () => {
    const [founder, historyItems, coreValues, galleryImages] = await Promise.all([
        getFounderMessage(),
        getHistoryItems(),
        getCoreValues(),
        getSalonGallery(),
    ]);

    return {
        props: {
            founder: founder as unknown as FounderData,
            historyItems: historyItems as unknown as HistoryItem[],
            coreValues: coreValues as unknown as CoreValue[],
            galleryImages: galleryImages as unknown as GalleryImage[],
        },
        revalidate: 3600,
    };
};
