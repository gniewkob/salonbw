import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Script from 'next/script';
import { jsonLd, absUrl } from '@/utils/seo';
import Image from 'next/image';
import Link from 'next/link';
import FAQAccordion, { FAQItem } from '@/components/FAQAccordion';
import PublicLayout from '@/components/PublicLayout';
import { trackEvent } from '@/utils/analytics';
import ImageLightbox from '@/components/ImageLightbox';
import { BUSINESS_INFO, SEO_META } from '@/config/content';
import { getPanelUrl } from '@/utils/panelUrl';
import HeroSlider from '@/components/HeroSlider';
import FounderMessage from '@/components/FounderMessage';
import HistoryAccordion from '@/components/HistoryAccordion';
import ValuesSection from '@/components/ValuesSection';
import SalonGallery from '@/components/SalonGallery';

export default function HomePage() {
    const galleryImages = [
        '/assets/img/slider/slider1.jpg',
        '/assets/img/slider/slider2.jpg',
        '/assets/img/slider/slider3.jpg',
    ];

    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    // Analytics: page view
    useEffect(() => {
        try {
            trackEvent('page_view', {
                page_title: 'Home',
            });
        } catch {}
    }, []);

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
                    openingHoursSpecification: [
                        {
                            '@type': 'OpeningHoursSpecification',
                            dayOfWeek: [
                                'Monday',
                                'Tuesday',
                                'Wednesday',
                                'Thursday',
                                'Friday',
                            ],
                            opens: '10:00',
                            closes: '19:00',
                        },
                        {
                            '@type': 'OpeningHoursSpecification',
                            dayOfWeek: 'Saturday',
                            opens: '09:00',
                            closes: '15:00',
                        },
                    ],
                })}
            </Script>
            <div>
                {/* Hero Slider */}
                <HeroSlider />

                {/* Founder Message */}
                <FounderMessage />

                {/* History Accordion */}
                <HistoryAccordion />

                {/* Core Values */}
                <ValuesSection />

                {/* Salon Gallery */}
                <SalonGallery />

                {/* Contact Section with Map */}
                <section className="p-4 space-y-4 max-w-4xl mx-auto">
                    <h2 className="text-2xl font-bold text-center">Kontakt</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <div>
                                <h3 className="font-semibold text-lg">Adres</h3>
                                <p className="text-gray-700">
                                    {BUSINESS_INFO.address.street}
                                    <br />
                                    {BUSINESS_INFO.address.postalCode}{' '}
                                    {BUSINESS_INFO.address.city}
                                </p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">
                                    Godziny otwarcia
                                </h3>
                                <p className="text-gray-700">
                                    <strong>Poniedziałek - Piątek:</strong>{' '}
                                    {BUSINESS_INFO.hours.mondayFriday}
                                    <br />
                                    <strong>Sobota:</strong>{' '}
                                    {BUSINESS_INFO.hours.saturday}
                                    <br />
                                    <strong>Niedziela:</strong>{' '}
                                    {BUSINESS_INFO.hours.sunday}
                                </p>
                            </div>
                            <div className="pt-4">
                                <Link
                                    href="/contact"
                                    className="inline-block bg-black text-white px-6 py-3 rounded-md hover:bg-gray-800 transition focus:outline-none focus:ring-2 focus:ring-brand-gold"
                                >
                                    Zobacz pełne informacje
                                </Link>
                            </div>
                            <div className="pt-2">
                                <a
                                    href={getPanelUrl(
                                        `/auth/login?redirect=${encodeURIComponent('/appointments')}`
                                    )}
                                    className="inline-block bg-brand-gold text-white px-6 py-3 rounded-md hover:bg-yellow-700 transition focus:outline-none focus:ring-2 focus:ring-brand-gold"
                                >
                                    {BUSINESS_INFO.booking.text}
                                </a>
                            </div>
                        </div>
                        <div>
                            <iframe
                                src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2549.${BUSINESS_INFO.coordinates.lat}!2d${BUSINESS_INFO.coordinates.lng}!3d${BUSINESS_INFO.coordinates.lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNTDCsDIwJzU1LjEiTiAxOMKwNTUnMTcuMSJF!5e0!3m2!1spl!2spl!4v1234567890123!5m2!1spl!2spl`}
                                className="w-full h-80 border-0 rounded-lg"
                                allowFullScreen
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                title={`Mapa salonu ${BUSINESS_INFO.name} w ${BUSINESS_INFO.address.city}`}
                            />
                        </div>
                    </div>
                </section>
            </div>
        </PublicLayout>
    );
}
