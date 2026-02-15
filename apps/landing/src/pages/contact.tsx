import ContactForm from '@/components/ContactForm';
import Head from 'next/head';
import PublicLayout from '@/components/PublicLayout';
import { BUSINESS_INFO, SEO_META } from '@/config/content';
import { getPanelUrl } from '@/utils/panelUrl';

export default function ContactPage() {
    const mapEmbedUrl = `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2549.${BUSINESS_INFO.coordinates.lat}!2d${BUSINESS_INFO.coordinates.lng}!3d${BUSINESS_INFO.coordinates.lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNTDCsDIwJzU1LjEiTiAxOMKwNTUnMTcuMSJF!5e0!3m2!1spl!2spl!4v1234567890123!5m2!1spl!2spl`;

    return (
        <PublicLayout>
            <Head>
                <title>Kontakt | {SEO_META.title}</title>
                <meta
                    name="description"
                    content="Skontaktuj się z salonem Black & White w Bytomiu. Umów wizytę online lub zadzwoń do nas."
                />
            </Head>
            <main id="main-content" className="container mx-auto px-4 py-12">
                <h1 className="text-4xl font-bold mb-8 text-center">
                    Kontakt
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-6xl mx-auto">
                    {/* Contact Information */}
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-bold mb-4 text-brand-gold">
                                Informacje kontaktowe
                            </h2>
                            <div className="space-y-3">
                                <div>
                                    <h3 className="font-semibold text-lg">
                                        Adres
                                    </h3>
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

                                {BUSINESS_INFO.contact.phone && (
                                    <div>
                                        <h3 className="font-semibold text-lg">
                                            Telefon
                                        </h3>
                                        <a
                                            href={`tel:${BUSINESS_INFO.contact.phone}`}
                                            className="text-brand-gold hover:underline focus:outline-none focus:ring-2 focus:ring-brand-gold focus:ring-offset-2"
                                        >
                                            {BUSINESS_INFO.contact.phone}
                                        </a>
                                    </div>
                                )}

                                {BUSINESS_INFO.contact.email && (
                                    <div>
                                        <h3 className="font-semibold text-lg">
                                            Email
                                        </h3>
                                        <a
                                            href={`mailto:${BUSINESS_INFO.contact.email}`}
                                            className="text-brand-gold hover:underline focus:outline-none focus:ring-2 focus:ring-brand-gold focus:ring-offset-2"
                                        >
                                            {BUSINESS_INFO.contact.email}
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Book Appointment CTA */}
                        <div className="bg-gray-100 p-6 rounded-lg">
                            <h3 className="text-xl font-bold mb-3">
                                Umów wizytę online
                            </h3>
                            <p className="text-gray-700 mb-4">
                                Zarezerwuj wizytę w naszym salonie w wygodny
                                sposób przez nasz panel online.
                            </p>
                            <a
                                href={getPanelUrl(BUSINESS_INFO.booking.url)}
                                className="inline-block bg-black text-white px-8 py-3 rounded-md hover:bg-gray-800 transition focus:outline-none focus:ring-2 focus:ring-brand-gold"
                            >
                                {BUSINESS_INFO.booking.text}
                            </a>
                        </div>

                        {/* Social Media */}
                        <div>
                            <h3 className="text-xl font-bold mb-3">
                                Śledź nas
                            </h3>
                            <div className="flex space-x-4">
                                <a
                                    href={BUSINESS_INFO.social.facebook}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label="Facebook"
                                    className="text-gray-700 hover:text-brand-gold transition focus:outline-none focus:ring-2 focus:ring-brand-gold focus:ring-offset-2"
                                >
                                    <svg
                                        className="w-8 h-8"
                                        fill="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                    </svg>
                                </a>
                                <a
                                    href={BUSINESS_INFO.social.instagram}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label="Instagram"
                                    className="text-gray-700 hover:text-brand-gold transition focus:outline-none focus:ring-2 focus:ring-brand-gold focus:ring-offset-2"
                                >
                                    <svg
                                        className="w-8 h-8"
                                        fill="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                                    </svg>
                                </a>
                                <a
                                    href={BUSINESS_INFO.social.twitter}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label="Twitter"
                                    className="text-gray-700 hover:text-brand-gold transition focus:outline-none focus:ring-2 focus:ring-brand-gold focus:ring-offset-2"
                                >
                                    <svg
                                        className="w-8 h-8"
                                        fill="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                                    </svg>
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Contact Form & Map */}
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-bold mb-4 text-brand-gold">
                                Napisz do nas
                            </h2>
                            <ContactForm />
                        </div>

                        {/* Google Maps Embed */}
                        <div>
                            <h2 className="text-2xl font-bold mb-4 text-brand-gold">
                                Jak do nas trafić
                            </h2>
                            <div className="w-full h-64 bg-gray-200 rounded-lg overflow-hidden">
                                <iframe
                                    src={mapEmbedUrl}
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0 }}
                                    allowFullScreen
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                    title={`Mapa salonu ${BUSINESS_INFO.name} w ${BUSINESS_INFO.address.city}`}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </PublicLayout>
    );
}
