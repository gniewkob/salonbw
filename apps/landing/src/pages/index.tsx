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

export default function HomePage() {
    const heroImages = [
        '/assets/img/slider/slider1.jpg',
        '/assets/img/slider/slider2.jpg',
        '/assets/img/slider/slider3.jpg',
    ];

    const services = useMemo(
        () => [
            {
                title: 'Haircut',
                description: 'Professional cuts tailored to you.',
            },
            {
                title: 'Coloring',
                description: 'Vibrant colors and highlights.',
            },
            {
                title: 'Styling',
                description: 'Perfect style for any occasion.',
            },
            {
                title: 'Makeup',
                description: 'Look your best with our artists.',
            },
        ],
        [],
    );

    const galleryImages = heroImages;

    const featuredItems = useMemo(
        () =>
            services.map((s) => ({
                id: s.title.toLowerCase().replace(/\s+/g, '-'),
                name: s.title,
                category: 'Featured Services',
                href: s.title.toLowerCase().includes('color')
                    ? '/services/coloring'
                    : '/services',
            })),
        [services],
    );

    const testimonials = [
        { name: 'Jane', text: 'Amazing service!' },
        { name: 'Sara', text: 'Loved my new look.' },
        { name: 'Mia', text: 'Friendly staff and great atmosphere.' },
    ];

    const faqs: FAQItem[] = [
        {
            question: 'What are your opening hours?',
            answer: 'We are open from 9AM to 5PM Monday through Friday.',
        },
        {
            question: 'How can I book an appointment?',
            answer: 'You can call us or use the contact form to schedule an appointment.',
        },
        {
            question: 'Do you accept walk-ins?',
            answer: 'Yes, walk-ins are welcome when availability permits.',
        },
    ];

    const [currentSlide, setCurrentSlide] = useState(0);
    const [testimonialIndex, setTestimonialIndex] = useState(0);
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % heroImages.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [heroImages.length]);

    useEffect(() => {
        const interval = setInterval(() => {
            setTestimonialIndex((prev) => (prev + 1) % testimonials.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [testimonials.length]);

    // Analytics: list impressions for featured services and gallery
    useEffect(() => {
        try {
            trackEvent('view_item_list', {
                item_list_name: 'home_featured_services',
                items: featuredItems.map((it) => ({
                    item_id: it.id,
                    item_name: it.name,
                    item_category: it.category,
                })),
            });
            trackEvent('view_item_list', {
                item_list_name: 'home_gallery',
                items: galleryImages.map((src, i) => ({
                    item_id: src,
                    item_name: `Gallery ${i + 1}`,
                    item_category: 'Gallery',
                })),
            });
        } catch {}
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
            <div className="space-y-12">
                {/* Hero Banner */}
                <section className="relative w-full h-64 sm:h-96 overflow-hidden">
                    {heroImages.map((src, index) => (
                        <Image
                            key={src}
                            src={src}
                            alt="Salon highlight"
                            fill
                            className={`object-cover transition-opacity duration-700 ${
                                index === currentSlide
                                    ? 'opacity-100'
                                    : 'opacity-0'
                            }`}
                            priority={index === 0}
                            sizes="100vw"
                        />
                    ))}
                </section>

                {/* Featured Services */}
                <section className="p-4 space-y-4">
                    <h2 className="text-xl font-bold text-center">
                        Featured Services
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {featuredItems.map((item) => (
                            <Link
                                key={item.id}
                                href={item.href}
                                className="p-4 border rounded text-center hover:shadow"
                                onClick={() =>
                                    trackEvent('select_item', {
                                        item_list_name:
                                            'home_featured_services',
                                        items: [
                                            {
                                                item_id: item.id,
                                                item_name: item.name,
                                                item_category: item.category,
                                            },
                                        ],
                                        cta: 'home_card',
                                    })
                                }
                            >
                                <h3 className="font-semibold">{item.name}</h3>
                                <p className="text-sm text-gray-600">
                                    {
                                        services.find(
                                            (s) => s.title === item.name,
                                        )!.description
                                    }
                                </p>
                            </Link>
                        ))}
                    </div>
                </section>

                {/* Mini Gallery */}
                <section className="p-4 space-y-4">
                    <h2 className="text-xl font-bold text-center">Gallery</h2>
                    <div className="grid grid-cols-3 gap-2">
                        {galleryImages.map((src, i) => (
                            <button
                                key={src}
                                type="button"
                                className="relative w-full h-24 sm:h-32"
                                onClick={() => (
                                    setLightboxIndex(i),
                                    trackEvent('select_item', {
                                        item_list_name: 'home_gallery',
                                        items: [
                                            {
                                                item_id: src,
                                                item_name: `Gallery ${i + 1}`,
                                                item_category: 'Gallery',
                                            },
                                        ],
                                        cta: 'home_gallery',
                                    })
                                )}
                                aria-label={`View gallery image ${i + 1}`}
                            >
                                <Image
                                    src={src}
                                    alt="Gallery image"
                                    fill
                                    className="object-cover"
                                />
                            </button>
                        ))}
                    </div>
                </section>
                {lightboxIndex !== null && (
                    <ImageLightbox
                        sources={galleryImages}
                        index={lightboxIndex}
                        alt="Gallery preview"
                        onPrev={() =>
                            setLightboxIndex((idx) =>
                                idx === null
                                    ? null
                                    : (idx + galleryImages.length - 1) %
                                      galleryImages.length,
                            )
                        }
                        onNext={() =>
                            setLightboxIndex((idx) =>
                                idx === null
                                    ? null
                                    : (idx + 1) % galleryImages.length,
                            )
                        }
                        onClose={() => setLightboxIndex(null)}
                    />
                )}

                {/* Testimonials Slider */}
                <section className="p-4 space-y-4 text-center">
                    <h2 className="text-xl font-bold">Testimonials</h2>
                    <p className="italic max-w-md mx-auto">
                        &quot;{testimonials[testimonialIndex].text}&quot;
                    </p>
                    <p className="mt-2 font-semibold">
                        - {testimonials[testimonialIndex].name}
                    </p>
                </section>

                {/* FAQ Preview */}
                <section className="p-4 space-y-4 max-w-md mx-auto">
                    <h2 className="text-xl font-bold text-center">
                        Frequently Asked Questions
                    </h2>
                    <FAQAccordion items={faqs} />
                    <div className="text-center">
                        <Link href="/faq" className="underline">
                            View all FAQs
                        </Link>
                    </div>
                </section>

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
                                    href={getPanelUrl(BUSINESS_INFO.booking.url)}
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
