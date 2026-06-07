import { useState } from 'react';
import ContactForm from '@/components/ContactForm';
import BookingModal from '@/components/BookingModal';
import Head from 'next/head';
import Script from 'next/script';
import PublicLayout from '@/components/PublicLayout';
import SectionHeader from '@/components/SectionHeader';
import { BUSINESS_INFO, SEO_META } from '@/config/content';
import { useLanguage } from '@/contexts/LanguageContext';
import { jsonLd, absUrl } from '@/utils/seo';

export default function ContactPage() {
    const [bookingOpen, setBookingOpen] = useState(false);
    const { T } = useLanguage();
    const c = T.contact;

    return (
        <PublicLayout>
            <Head>
                <title>
                    {c.title} | {SEO_META.title}
                </title>
                <meta
                    name="description"
                    content="Skontaktuj się z salonem Black & White w Bytomiu. Umów wizytę online lub wyślij wiadomość."
                />
                <meta
                    property="og:title"
                    content={`${c.title} — ${SEO_META.title}`}
                />
                <meta
                    property="og:description"
                    content="Skontaktuj się z salonem Black & White w Bytomiu. Umów wizytę online lub wyślij wiadomość."
                />
                <meta
                    property="og:image"
                    content={absUrl('/images/hero/slider1.jpg')}
                />
                <meta property="og:image:width" content="1200" />
                <meta property="og:image:height" content="630" />
                <meta property="og:type" content="website" />
                <meta property="og:locale" content="pl_PL" />
                <meta property="og:url" content={absUrl('/contact')} />
                <link rel="canonical" href={absUrl('/contact')} />
                <meta name="robots" content="index, follow" />
            </Head>
            <Script
                id="ld-contact"
                type="application/ld+json"
                strategy="afterInteractive"
            >
                {jsonLd({
                    '@context': 'https://schema.org',
                    '@type': 'ContactPage',
                    name: `Kontakt — ${BUSINESS_INFO.name}`,
                    description:
                        'Skontaktuj się z salonem Black & White w Bytomiu. Umów wizytę online lub wyślij wiadomość.',
                    url: absUrl('/contact'),
                    mainEntity: {
                        '@type': 'HairSalon',
                        name: BUSINESS_INFO.name,
                        telephone: BUSINESS_INFO.contact.phone,
                        email: BUSINESS_INFO.contact.email,
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
                    },
                })}
            </Script>

            <div
                style={{
                    background: '#0d0d0d',
                    minHeight: '100vh',
                    paddingBottom: '6rem',
                }}
            >
                <div
                    className="container mx-auto px-4 md:px-8"
                    style={{ paddingTop: '5rem' }}
                >
                    <SectionHeader
                        eyebrow={c.eyebrow}
                        title={c.title}
                        subtitle={`${BUSINESS_INFO.address.street}, ${BUSINESS_INFO.address.city} · ${BUSINESS_INFO.contact.phone}`}
                        dark
                        as="h1"
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 max-w-5xl mx-auto">
                        {/* Left: info + map */}
                        <div>
                            <a
                                href={`tel:${BUSINESS_INFO.contact.phone.replace(/\s/g, '')}`}
                                className="block group mb-10"
                            >
                                <span
                                    className="text-xs uppercase block mb-1"
                                    style={{
                                        color: 'rgba(255,255,255,0.6)',
                                        letterSpacing: '0.12em',
                                        fontFamily:
                                            'var(--font-open-sans), sans-serif',
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
                                            'clamp(1.6rem, 3.5vw, 2.4rem)',
                                        color: '#ffffff',
                                        letterSpacing: '-0.01em',
                                    }}
                                >
                                    {BUSINESS_INFO.contact.phone}
                                </span>
                            </a>

                            <div className="mb-10">
                                <span
                                    className="text-xs uppercase block mb-2"
                                    style={{
                                        color: 'rgba(255,255,255,0.6)',
                                        letterSpacing: '0.12em',
                                        fontFamily:
                                            'var(--font-open-sans), sans-serif',
                                    }}
                                >
                                    {c.addressLabel}
                                </span>
                                <address
                                    className="not-italic"
                                    style={{
                                        color: 'rgba(255,255,255,0.65)',
                                        lineHeight: 1.8,
                                        fontFamily:
                                            'var(--font-open-sans), sans-serif',
                                    }}
                                >
                                    {BUSINESS_INFO.address.street}
                                    <br />
                                    {BUSINESS_INFO.address.postalCode}{' '}
                                    {BUSINESS_INFO.address.city}
                                </address>
                            </div>

                            <div className="mb-10">
                                <span
                                    className="text-xs uppercase block mb-3"
                                    style={{
                                        color: 'rgba(255,255,255,0.6)',
                                        letterSpacing: '0.12em',
                                        fontFamily:
                                            'var(--font-open-sans), sans-serif',
                                    }}
                                >
                                    {c.hoursTitle}
                                </span>
                                {[
                                    {
                                        day: c.dayMonFri,
                                        hours: BUSINESS_INFO.hours.mondayFriday,
                                        closed: false,
                                    },
                                    {
                                        day: c.daySat,
                                        hours: BUSINESS_INFO.hours.saturday,
                                        closed: false,
                                    },
                                    {
                                        day: c.daySun,
                                        hours: T.footer.sunday,
                                        closed: true,
                                    },
                                ].map(({ day, hours, closed }) => (
                                    <div
                                        key={day}
                                        className="flex justify-between items-center py-2.5"
                                        style={{
                                            borderBottom:
                                                '1px solid rgba(255,255,255,0.06)',
                                        }}
                                    >
                                        <span
                                            className="text-sm"
                                            style={{
                                                color: 'rgba(255,255,255,0.6)',
                                                fontFamily:
                                                    'var(--font-open-sans), sans-serif',
                                            }}
                                        >
                                            {day}
                                        </span>
                                        <span
                                            className="text-sm font-medium"
                                            style={{
                                                color: closed
                                                    ? 'rgba(255,255,255,0.55)'
                                                    : '#b4b8be',
                                                fontFamily:
                                                    'var(--font-open-sans), sans-serif',
                                            }}
                                        >
                                            {hours}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="relative">
                                <div
                                    className="absolute"
                                    style={{
                                        inset: 0,
                                        border: '1px solid rgba(180,184,190,0.2)',
                                        borderRadius: '3px',
                                        transform: 'translate(6px, 6px)',
                                        zIndex: 0,
                                    }}
                                />
                                <iframe
                                    src={`https://maps.google.com/maps?q=${BUSINESS_INFO.coordinates.lat},${BUSINESS_INFO.coordinates.lng}&z=16&output=embed&hl=pl`}
                                    className="relative w-full"
                                    style={{
                                        height: '260px',
                                        borderRadius: '3px',
                                        filter: 'grayscale(0.4) contrast(1.05)',
                                        zIndex: 1,
                                        display: 'block',
                                    }}
                                    allowFullScreen
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                    title={`Mapa salonu ${BUSINESS_INFO.name} w ${BUSINESS_INFO.address.city}`}
                                />
                            </div>
                        </div>

                        {/* Right: booking CTA + contact form */}
                        <div>
                            {/* Primary CTA */}
                            <div
                                className="mb-10"
                                style={{
                                    paddingBottom: '2.5rem',
                                    borderBottom:
                                        '1px solid rgba(180,184,190,0.12)',
                                }}
                            >
                                <p
                                    className="text-xs uppercase mb-3"
                                    style={{
                                        color: '#b4b8be',
                                        letterSpacing: '0.12em',
                                        fontFamily:
                                            'var(--font-open-sans), sans-serif',
                                    }}
                                >
                                    {c.bookingTitle}
                                </p>
                                <p
                                    className="mb-5"
                                    style={{
                                        color: 'rgba(255,255,255,0.55)',
                                        fontSize: '0.9rem',
                                        lineHeight: 1.7,
                                        fontFamily:
                                            'var(--font-open-sans), sans-serif',
                                    }}
                                >
                                    {c.bookingDesc}
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setBookingOpen(true)}
                                    className="btn-silver"
                                    style={{
                                        padding: '0.85rem 2rem',
                                        fontSize: '0.7rem',
                                        fontWeight: 700,
                                        letterSpacing: '0.18em',
                                        textTransform: 'uppercase',
                                        borderRadius: '2px',
                                        border: 'none',
                                        cursor: 'pointer',
                                    }}
                                >
                                    {c.bookingBtn}
                                </button>
                            </div>

                            {/* Contact form */}
                            <p
                                className="text-xs uppercase mb-6"
                                style={{
                                    color: 'rgba(255,255,255,0.6)',
                                    letterSpacing: '0.12em',
                                    fontFamily:
                                        'var(--font-open-sans), sans-serif',
                                }}
                            >
                                {c.formSubtitle}
                            </p>
                            <ContactForm />
                        </div>
                    </div>
                </div>
            </div>

            <BookingModal
                open={bookingOpen}
                onClose={() => setBookingOpen(false)}
            />
        </PublicLayout>
    );
}
