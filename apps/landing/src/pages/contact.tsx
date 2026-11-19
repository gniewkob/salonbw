import { useState } from 'react';
import ContactForm from '@/components/ContactForm';
import BookingModal from '@/components/BookingModal';
import Head from 'next/head';
import PublicLayout from '@/components/PublicLayout';
import PageHero from '@/components/page/PageHero';
import MapFacade from '@/components/MapFacade';
import { useOpeningHours } from '@/hooks/useOpeningHours';
import { BUSINESS_INFO, SEO_META } from '@/config/content';
import { useLanguage } from '@/contexts/LanguageContext';
import { jsonLd, absUrl } from '@/utils/seo';
import type { GetServerSideProps } from 'next';
import { getOpeningHours } from '@/utils/contentApi';
import type { WeeklyHours } from '@/utils/openingHours';

interface ContactPageProps {
    openingHours?: WeeklyHours | null;
}

export default function ContactPage({
    openingHours: initialHours,
}: ContactPageProps) {
    const [bookingOpen, setBookingOpen] = useState(false);
    const { T } = useLanguage();
    const { lines: openingHours, specification } =
        useOpeningHours(initialHours);
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
                {/* Rendered server-side: crawlers that do not execute
                    JavaScript (and link previews) must see the schema. */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: jsonLd({
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
                                    postalCode:
                                        BUSINESS_INFO.address.postalCode,
                                    addressCountry: SEO_META.geo.country,
                                },
                                geo: {
                                    '@type': 'GeoCoordinates',
                                    latitude: BUSINESS_INFO.coordinates.lat,
                                    longitude: BUSINESS_INFO.coordinates.lng,
                                },
                                openingHoursSpecification: specification,
                            },
                        }),
                    }}
                />
            </Head>

            <div
                style={{
                    background: 'var(--brand-black)',
                    minHeight: '100vh',
                    paddingBottom: '6rem',
                }}
            >
                <PageHero
                    eyebrow={c.eyebrow}
                    title={c.title}
                    lead={`${BUSINESS_INFO.address.street}, ${BUSINESS_INFO.address.city} · ${BUSINESS_INFO.contact.phone}`}
                    image={{
                        src: '/images/salon/salon8.jpg',
                        alt: 'Poczekalnia salonu Black & White',
                    }}
                />
                <div
                    style={{
                        paddingInline: 'var(--page-gutter)',
                        paddingTop: 'clamp(3rem, 5vw, 4.5rem)',
                    }}
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 max-w-5xl">
                        {/* Left: contact info */}
                        <div>
                            <a
                                href={`tel:${BUSINESS_INFO.contact.phone.replace(/\s/g, '')}`}
                                className="block group mb-10"
                            >
                                <span
                                    className="text-xs uppercase block mb-1"
                                    style={{
                                        color: 'var(--white-muted)',
                                        letterSpacing: '0.12em',
                                        fontFamily:
                                            'var(--font-body)',
                                    }}
                                >
                                    {c.phoneLabel}
                                </span>
                                <span
                                    className="block transition-opacity duration-200 group-hover:opacity-70"
                                    style={{
                                        fontFamily:
                                            'var(--font-display)',
                                        fontSize:
                                            'clamp(1.6rem, 3.5vw, 2.4rem)',
                                        color: 'var(--brand-white)',
                                        letterSpacing: '-0.01em',
                                    }}
                                >
                                    {BUSINESS_INFO.contact.phone}
                                </span>
                            </a>

                            <a
                                href={`mailto:${BUSINESS_INFO.contact.email}`}
                                className="block group mb-10"
                            >
                                <span
                                    className="text-xs uppercase block mb-1"
                                    style={{
                                        color: 'var(--white-muted)',
                                        letterSpacing: '0.12em',
                                        fontFamily:
                                            'var(--font-body)',
                                    }}
                                >
                                    {c.emailLabel}
                                </span>
                                <span
                                    className="block transition-opacity duration-200 group-hover:opacity-70"
                                    style={{
                                        color: 'var(--brand-white)',
                                        fontSize: 'var(--text-body)',
                                        letterSpacing: '0.01em',
                                        wordBreak: 'break-word',
                                        fontFamily:
                                            'var(--font-body)',
                                    }}
                                >
                                    {BUSINESS_INFO.contact.email}
                                </span>
                            </a>

                            <div className="mb-10">
                                <span
                                    className="text-xs uppercase block mb-2"
                                    style={{
                                        color: 'var(--white-muted)',
                                        letterSpacing: '0.12em',
                                        fontFamily:
                                            'var(--font-body)',
                                    }}
                                >
                                    {c.addressLabel}
                                </span>
                                <address
                                    className="not-italic"
                                    style={{
                                        color: 'var(--white-soft)',
                                        lineHeight: 1.8,
                                        fontFamily:
                                            'var(--font-body)',
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
                                        color: 'var(--white-muted)',
                                        letterSpacing: '0.12em',
                                        fontFamily:
                                            'var(--font-body)',
                                    }}
                                >
                                    {c.hoursTitle}
                                </span>
                                {[
                                    ...openingHours.map((line) => ({
                                        day: line.label,
                                        hours: line.value,
                                        closed: !!line.closed,
                                    })),
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
                                                color: 'var(--white-muted)',
                                                fontFamily:
                                                    'var(--font-body)',
                                            }}
                                        >
                                            {day}
                                        </span>
                                        <span
                                            className="text-sm font-medium"
                                            style={{
                                                color: closed
                                                    ? 'var(--white-label)'
                                                    : 'var(--brand-silver)',
                                                fontFamily:
                                                    'var(--font-body)',
                                            }}
                                        >
                                            {hours}
                                        </span>
                                    </div>
                                ))}
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
                                        color: 'var(--brand-silver)',
                                        letterSpacing: '0.12em',
                                        fontFamily:
                                            'var(--font-body)',
                                    }}
                                >
                                    {c.bookingTitle}
                                </p>
                                <p
                                    className="mb-5"
                                    style={{
                                        color: 'var(--white-label)',
                                        fontSize: 'var(--text-small)',
                                        lineHeight: 1.7,
                                        fontFamily:
                                            'var(--font-body)',
                                    }}
                                >
                                    {c.bookingDesc}
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setBookingOpen(true)}
                                    className="bw-btn bw-btn--primary"
                                >
                                    {c.bookingBtn}
                                </button>
                            </div>

                            {/* Contact form */}
                            <p
                                className="text-xs uppercase mb-6"
                                style={{
                                    color: 'var(--white-muted)',
                                    letterSpacing: '0.12em',
                                    fontFamily:
                                        'var(--font-body)',
                                }}
                            >
                                {c.formSubtitle}
                            </p>
                            <ContactForm />
                        </div>
                    </div>

                    {/* Full-width map below the info/form columns */}
                    <div className="relative max-w-5xl mt-16">
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
                        <MapFacade height={360} grayscale={0.4} />
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

export const getServerSideProps: GetServerSideProps<
    ContactPageProps
> = async () => ({
    props: { openingHours: await getOpeningHours() },
});
