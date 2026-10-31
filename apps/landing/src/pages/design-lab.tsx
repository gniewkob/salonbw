import { useState } from 'react';
import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import PublicLayout from '@/components/PublicLayout';
import SplitHero from '@/components/SplitHero';
import ServicesTeaser from '@/components/ServicesTeaser';
import SalonGallery from '@/components/SalonGallery';
import Testimonials from '@/components/Testimonials';
import BookingCta from '@/components/BookingCta';
import BookingModal from '@/components/BookingModal';
import NearestSlotTeaser from '@/components/NearestSlotTeaser';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Language } from '@/i18n/translations';
import { BUSINESS_INFO } from '@/config/content';
import styles from '@/styles/DesignLab.module.css';

type Variant = 'baseline' | 'editorial' | 'booking';

type LabCopy = {
    heading: string;
    description: string;
    variants: string;
    baseline: string;
    editorial: string;
    booking: string;
    preview: string;
    editorialEyebrow: string;
    editorialTitle: string;
    editorialBody: string;
    editorialAside: string;
    bookingEyebrow: string;
    bookingTitle: string;
    bookingBody: string;
    bookingStepsTitle: string;
    bookingSteps: [string, string, string];
    bookingCategoryHeading: string;
    categories: [string, string, string];
    viewServices: string;
    baselineNote: string;
};

const COPY: Record<Language, LabCopy> = {
    pl: {
        heading: 'Laboratorium projektu strony',
        description: 'Warianty demonstracyjne. Rezerwacje prowadzą do istniejącego, działającego procesu.',
        variants: 'Wybierz wariant strony',
        baseline: 'Obecny projekt',
        editorial: 'Editorial Premium',
        booking: 'Booking First',
        preview: 'Podgląd projektu',
        editorialEyebrow: 'Black & White · Akademia Zdrowych Włosów',
        editorialTitle: 'Włosy w dobrych rękach.',
        editorialBody: 'Poznaj nasze usługi, zobacz salon i umów wizytę w dogodnym terminie.',
        editorialAside: 'Fryzjerstwo · Koloryzacja · Pielęgnacja',
        bookingEyebrow: 'Salon Black & White · Bytom',
        bookingTitle: 'Znajdź chwilę dla swoich włosów.',
        bookingBody: 'Wybierz usługę i przejdź do rezerwacji online. Możesz też skontaktować się z salonem.',
        bookingStepsTitle: 'Jak umówić wizytę?',
        bookingSteps: ['Poznaj usługi', 'Wybierz dostępny termin', 'Potwierdź rezerwację'],
        bookingCategoryHeading: 'Od czego chcesz zacząć?',
        categories: ['Strzyżenie', 'Koloryzacja', 'Pielęgnacja włosów'],
        viewServices: 'Zobacz usługi',
        baselineNote: 'To istniejące komponenty strony głównej. Pełną obecną stronę zobaczysz pod adresem głównym.',
    },
    en: {
        heading: 'Website design lab',
        description: 'Demo concepts. Booking buttons preserve the current booking flow.',
        variants: 'Choose a design',
        baseline: 'Current design',
        editorial: 'Editorial Premium',
        booking: 'Booking First',
        preview: 'Design preview',
        editorialEyebrow: 'Black & White · Healthy Hair Academy',
        editorialTitle: 'Your hair, thoughtfully cared for.',
        editorialBody: 'Explore our services, discover the salon and book an appointment that works for you.',
        editorialAside: 'Hairdressing · Colour · Care',
        bookingEyebrow: 'Salon Black & White · Bytom',
        bookingTitle: 'Make time for your hair.',
        bookingBody: 'Explore a service and continue to online booking, or contact the salon directly.',
        bookingStepsTitle: 'How to book',
        bookingSteps: ['Explore services', 'Choose an available time', 'Confirm your appointment'],
        bookingCategoryHeading: 'Where would you like to start?',
        categories: ['Haircuts', 'Colour', 'Hair care'],
        viewServices: 'Explore services',
        baselineNote: 'These are existing homepage components. The full current site remains available at the home address.',
    },
    de: {
        heading: 'Website-Designlabor',
        description: 'Entwürfe zur Ansicht. Die Buchung führt weiterhin zum bestehenden Ablauf.',
        variants: 'Design auswählen',
        baseline: 'Aktuelles Design',
        editorial: 'Editorial Premium',
        booking: 'Booking First',
        preview: 'Designvorschau',
        editorialEyebrow: 'Black & White · Akademie für gesundes Haar',
        editorialTitle: 'Ihr Haar in guten Händen.',
        editorialBody: 'Entdecken Sie unsere Leistungen, lernen Sie den Salon kennen und buchen Sie Ihren Termin.',
        editorialAside: 'Friseur · Coloration · Pflege',
        bookingEyebrow: 'Salon Black & White · Bytom',
        bookingTitle: 'Zeit für Ihr Haar.',
        bookingBody: 'Wählen Sie eine Leistung und buchen Sie online oder kontaktieren Sie den Salon direkt.',
        bookingStepsTitle: 'So funktioniert die Buchung',
        bookingSteps: ['Leistungen entdecken', 'Freien Termin wählen', 'Buchung bestätigen'],
        bookingCategoryHeading: 'Womit möchten Sie beginnen?',
        categories: ['Haarschnitt', 'Coloration', 'Haarpflege'],
        viewServices: 'Leistungen ansehen',
        baselineNote: 'Dies sind vorhandene Startseiten-Komponenten. Die vollständige bisherige Seite bleibt unter der Startadresse verfügbar.',
    },
};

/**
 * Hosted development deliberately runs NODE_ENV=production for Next.js.
 * Never use NODE_ENV to enable an internal design lab: APP_ENV is the
 * server-side environment boundary declared in the project topology.
 */
export const getServerSideProps: GetServerSideProps = async () => {
    if (process.env.APP_ENV !== 'development') {
        return { notFound: true };
    }

    return { props: {} };
};

export default function DesignLabPage() {
    const { lang, T } = useLanguage();
    const copy = COPY[lang];
    const [variant, setVariant] = useState<Variant>('editorial');
    const [bookingOpen, setBookingOpen] = useState(false);

    const choose = (next: Variant) => {
        setBookingOpen(false);
        setVariant(next);
    };

    return (
        <PublicLayout>
            <Head>
                <title>{copy.heading} | {BUSINESS_INFO.name}</title>
                <meta name="robots" content="noindex, nofollow, noarchive" />
                <meta name="description" content={copy.description} />
            </Head>

            <div className={styles.lab}>
                <header className={styles.controls}>
                    <div className={styles.controlsInner}>
                        <div>
                            <span className={styles.labMark}>DESIGN LAB / DEV</span>
                            <h1 className={styles.labTitle}>{copy.heading}</h1>
                            <p className={styles.labDescription}>{copy.description}</p>
                        </div>
                        <div
                            className={styles.variantPicker}
                            role="group"
                            aria-label={copy.variants}
                        >
                            {(['baseline', 'editorial', 'booking'] as const).map((item) => (
                                <button
                                    key={item}
                                    type="button"
                                    className={variant === item ? styles.variantActive : styles.variantButton}
                                    aria-pressed={variant === item}
                                    onClick={() => choose(item)}
                                >
                                    {copy[item]}
                                </button>
                            ))}
                        </div>
                    </div>
                </header>

                <div aria-live="polite" className={styles.previewLabel}>
                    {copy.preview}: <strong>{copy[variant]}</strong>
                </div>

                {variant === 'baseline' ? (
                    <>
                        <SplitHero />
                        <ServicesTeaser />
                        <Testimonials />
                        <BookingCta />
                        <div className={styles.baselineNote}>
                            {copy.baselineNote}{' '}
                            <Link href="/">{T.nav.home}</Link>
                        </div>
                    </>
                ) : variant === 'editorial' ? (
                    <>
                        <section className={styles.editorialHero} aria-label={copy.editorialTitle}>
                            <div className={styles.editorialText}>
                                <p className={styles.eyebrow}>{copy.editorialEyebrow}</p>
                                <h2 className={styles.editorialHeading}>
                                    {copy.editorialTitle}
                                </h2>
                                <p className={styles.editorialLead}>{copy.editorialBody}</p>
                                <div className={styles.actions}>
                                    <button
                                        type="button"
                                        className={styles.primaryAction}
                                        onClick={() => setBookingOpen(true)}
                                    >
                                        {T.nav.booking}
                                    </button>
                                    <Link href="/services" className={styles.secondaryAction}>
                                        {copy.viewServices}
                                    </Link>
                                </div>
                                <p className={styles.editorialMeta}>
                                    {BUSINESS_INFO.address.city} · {copy.editorialAside}
                                </p>
                            </div>
                            <div className={styles.editorialVisual}>
                                <Image
                                    src="/images/hero/slider1.jpg"
                                    alt={T.hero.imageAlt}
                                    fill
                                    priority
                                    sizes="(max-width: 850px) 100vw, 52vw"
                                    className={styles.coverImage}
                                />
                                <div className={styles.imageCaption}>
                                    {BUSINESS_INFO.name}
                                </div>
                            </div>
                        </section>
                        <ServicesTeaser />
                        <SalonGallery />
                        <Testimonials />
                        <BookingCta />
                    </>
                ) : (
                    <>
                        <section className={styles.bookingHero} aria-label={copy.bookingTitle}>
                            <div className={styles.bookingCopy}>
                                <p className={styles.eyebrow}>{copy.bookingEyebrow}</p>
                                <h2 className={styles.bookingHeading}>{copy.bookingTitle}</h2>
                                <p className={styles.bookingLead}>{copy.bookingBody}</p>
                                <div className={styles.actions}>
                                    <button
                                        type="button"
                                        className={styles.primaryAction}
                                        onClick={() => setBookingOpen(true)}
                                    >
                                        {T.nav.booking}
                                    </button>
                                    <Link href="/services" className={styles.secondaryAction}>
                                        {copy.viewServices}
                                    </Link>
                                </div>
                                <p className={styles.nearestSlot}>
                                    {BUSINESS_INFO.address.city}
                                    <NearestSlotTeaser />
                                </p>
                            </div>
                            <div className={styles.bookingPhoto}>
                                <Image
                                    src="/images/hero/DSC_9583.jpg"
                                    alt={T.hero.imageAlt}
                                    fill
                                    sizes="(max-width: 850px) 100vw, 40vw"
                                    className={styles.coverImage}
                                />
                            </div>
                        </section>
                        <section className={styles.bookingEntry} aria-label={copy.bookingCategoryHeading}>
                            <div className={styles.entryInner}>
                                <p className={styles.eyebrow}>{copy.bookingStepsTitle}</p>
                                <ol className={styles.steps}>
                                    {copy.bookingSteps.map((step, index) => (
                                        <li key={step}>
                                            <span aria-hidden="true">0{index + 1}</span>
                                            {step}
                                        </li>
                                    ))}
                                </ol>
                                <h3 className={styles.entryHeading}>{copy.bookingCategoryHeading}</h3>
                                <div className={styles.categories}>
                                    {copy.categories.map((category, index) => (
                                        <Link href="/services" key={category} className={styles.categoryLink}>
                                            <span className={styles.categoryNumber} aria-hidden="true">
                                                0{index + 1}
                                            </span>
                                            <span>{category}</span>
                                            <span aria-hidden="true">→</span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </section>
                        <ServicesTeaser />
                        <Testimonials />
                        <BookingCta />
                    </>
                )}
            </div>
            <BookingModal
                open={bookingOpen}
                onClose={() => setBookingOpen(false)}
            />
        </PublicLayout>
    );
}
