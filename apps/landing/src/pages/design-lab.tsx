import { useState } from 'react';
import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import PublicLayout from '@/components/PublicLayout';
import BookingModal from '@/components/BookingModal';
import { useLanguage } from '@/contexts/LanguageContext';
import { trackEvent } from '@/utils/analytics';
import { BUSINESS_INFO } from '@/config/content';
import styles from '@/styles/DesignLab.module.css';
import ImmersiveExperience from '@/components/ImmersiveExperience';
import MotionReel from '@/components/MotionReel';
import OrbitAtelier from '@/components/OrbitAtelier';

export type DesignVariant = 'editorial' | 'cinematic' | 'atelier' | 'immersive' | 'reel' | 'orbit';
interface DesignLabProps {
    initialVariant: DesignVariant;
}

const VARIANTS: ReadonlyArray<{ id: DesignVariant; title: string; description: string }> = [
    { id: 'editorial', title: '01 / Fashion Editorial', description: 'Typografia, fotografia, rytm magazynu' },
    { id: 'cinematic', title: '02 / Cinematic Monochrome', description: 'Światło, kadr, atmosfera' },
    { id: 'atelier', title: '03 / Swiss Atelier', description: 'Siatka, precyzja, czysta typografia' },
    { id: 'immersive', title: '04 / Immersive Experience', description: 'Kamera, głębia, galeria, ruch' },
    { id: 'reel', title: '05 / Motion Reel', description: 'Filmowa taśma i zdjęcia' },
    { id: 'orbit', title: '06 / Spatial Atelier', description: 'Obrót 3D i detale salonu' },
];

const OFFER_LINKS = [
    '/services?offer=hairdressing',
    '/services?offer=care',
    '/services?offer=extensions',
] as const;

const COPY = {
    pl: {
        label: 'Pracownia kierunków wizualnych',
        explanation: 'Trzy autorskie propozycje. Te same usługi, realny katalog i ta sama rezerwacja.',
        backstage: 'Wersja porównawcza — tylko DEV',
        salon: 'Salon fryzjerski / Bytom',
        detail: 'Akademia Zdrowych Włosów',
        lineOne: 'Fryzjerstwo',
        lineTwo: 'jest sztuką.',
        cinematicLead: 'Forma. Światło.',
        cinematicFollow: 'Twoje włosy.',
        atelierLead: 'Włosy.',
        atelierFollow: 'Twoja forma.',
        editorialNote: 'Własny styl zaczyna się od zdrowych włosów.',
        cinematicNote: 'Indywidualne podejście do cięcia, koloru i pielęgnacji.',
        atelierNote: 'Precyzyjna koloryzacja, strzyżenie i świadoma pielęgnacja.',
        offerHeading: 'Odkryj zakres usług',
        prices: 'Aktualne warianty, czas i ceny są dostępne w katalogu usług.',
        view: 'Poznaj ofertę',
        gallery: 'Zobacz salon',
        section: '01 / Oferta',
        direction: 'Wybierz kierunek',
    },
    en: {
        label: 'Visual direction studio',
        explanation: 'Three original directions. The same real services and booking flow.',
        backstage: 'Design comparison — DEV only',
        salon: 'Hair studio / Bytom',
        detail: 'Healthy Hair Academy',
        lineOne: 'Hair is',
        lineTwo: 'an art.',
        cinematicLead: 'Form. Light.',
        cinematicFollow: 'Your hair.',
        atelierLead: 'Hair.',
        atelierFollow: 'Your signature.',
        editorialNote: 'Personal style begins with healthy hair.',
        cinematicNote: 'A considered approach to cutting, colour and care.',
        atelierNote: 'Precision cutting, colouring and thoughtful care.',
        offerHeading: 'Explore our services',
        prices: 'Live options, durations and prices are available in the service catalogue.',
        view: 'Explore services',
        gallery: 'Visit the studio',
        section: '01 / Services',
        direction: 'Choose a direction',
    },
    de: {
        label: 'Atelier für Gestaltung',
        explanation: 'Drei eigenständige Entwürfe. Echte Leistungen und derselbe Buchungsablauf.',
        backstage: 'Designvergleich — nur DEV',
        salon: 'Friseursalon / Bytom',
        detail: 'Akademie für gesundes Haar',
        lineOne: 'Haar ist',
        lineTwo: 'eine Kunst.',
        cinematicLead: 'Form. Licht.',
        cinematicFollow: 'Dein Haar.',
        atelierLead: 'Haar.',
        atelierFollow: 'Dein Stil.',
        editorialNote: 'Persönlicher Stil beginnt mit gesundem Haar.',
        cinematicNote: 'Individueller Ansatz für Schnitt, Farbe und Pflege.',
        atelierNote: 'Präzise Schnitte, Colorationen und bewusste Pflege.',
        offerHeading: 'Unsere Leistungen entdecken',
        prices: 'Aktuelle Varianten, Dauer und Preise stehen im Leistungskatalog.',
        view: 'Leistungen ansehen',
        gallery: 'Salon entdecken',
        section: '01 / Leistungen',
        direction: 'Stilrichtung wählen',
    },
} as const;

type Copy = (typeof COPY)[keyof typeof COPY];
type ServiceTexts = ReadonlyArray<{ title: string; description: string }>;

function BookingButton({ label, onClick, className }: {
    label: string;
    onClick: () => void;
    className: string;
}) {
    return (
        <button type="button" onClick={onClick} className={className}>
            {label}<span aria-hidden="true"> ↗</span>
        </button>
    );
}

function OfferIndex({ copy, services, variant }: {
    copy: Copy;
    services: ServiceTexts;
    variant: DesignVariant;
}) {
    return (
        <section className={styles.offerSection} aria-labelledby="lab-offer-title">
            <div className={styles.offerIntro}>
                <p className={styles.eyebrow}>{copy.section}</p>
                <h2 id="lab-offer-title">{copy.offerHeading}</h2>
                <p>{copy.prices}</p>
            </div>
            <div className={styles.offerRows} data-cy="design-offers">
                {services.map(({ title, description }, index) => (
                    <Link className={styles.offerRow} key={OFFER_LINKS[index]}
                        href={OFFER_LINKS[index]} data-cy={'design-offer-' + index}>
                        <span className={styles.offerNum}>0{index + 1}</span>
                        <span className={styles.offerText}>
                            <strong>{title}</strong>
                            <span>{description}</span>
                        </span>
                        <span className={styles.offerArrow} aria-hidden="true">↗</span>
                    </Link>
                ))}
            </div>
            <Link className={styles.offerAll} href="/services">{copy.view} ↗</Link>
            <span className={styles.offerSignature} aria-hidden="true">
                {variant === 'cinematic' ? 'B / W' : 'Black & White'}
            </span>
        </section>
    );
}

function Editorial({ copy, services, booking, bookingLabel }: {
    copy: Copy; services: ServiceTexts; booking: () => void; bookingLabel: string;
}) {
    return (
        <div className={[styles.stage, styles.editorial].join(' ')} data-cy="design-editorial">
            <section className={styles.editorialHero} aria-labelledby="lab-editorial-h1">
                <div className={styles.editorialTopline}>
                    <span>{copy.salon}</span><span>EST. 2011 / B&W</span>
                </div>
                <div className={styles.editorialMasthead}>
                    <p className={styles.eyebrow}>{copy.detail}</p>
                    <h1 id="lab-editorial-h1">BLACK<span>&amp;</span>WHITE</h1>
                </div>
                <div className={styles.editorialPicture}>
                    <Image src="/images/hero/DSC_9584.jpg"
                        alt="Stanowiska fryzjerskie salonu Black & White"
                        fill priority sizes="(max-width: 768px) 100vw, 70vw"
                        className={styles.coverImage}/>
                    <span className={styles.photoIndex}>01 — ATELIER / BYTOM</span>
                </div>
                <div className={styles.editorialCaption}>
                    <div><span className={styles.eyebrow}>THE HAIR EDIT</span>
                        <p>{copy.lineOne}<br/><em>{copy.lineTwo}</em></p></div>
                    <div className={styles.editorialCaptionEnd}>
                        <p>{copy.editorialNote}</p>
                        <BookingButton label={bookingLabel} onClick={booking} className={styles.darkButton}/>
                    </div>
                </div>
            </section>
            <OfferIndex copy={copy} services={services} variant="editorial"/>
        </div>
    );
}

function Cinematic({ copy, services, booking, bookingLabel }: {
    copy: Copy; services: ServiceTexts; booking: () => void; bookingLabel: string;
}) {
    return (
        <div className={[styles.stage, styles.cinematic].join(' ')} data-cy="design-cinematic">
            <section className={styles.cinematicHero} aria-labelledby="lab-cinematic-h1">
                <Image src="/images/hero/DSC_9576.jpg" alt="Recepcja salonu Black & White"
                    fill priority sizes="100vw" className={styles.cinematicPhoto}/>
                <div className={styles.cinematicScrim} aria-hidden="true"/>
                <div className={styles.cinematicMeta}>
                    <span>BLACK &amp; WHITE</span><span>{copy.salon}</span>
                </div>
                <div className={styles.cinematicStory}>
                    <p className={styles.eyebrow}>{copy.detail} — 2011</p>
                    <h1 id="lab-cinematic-h1">{copy.cinematicLead}<br/><em>{copy.cinematicFollow}</em></h1>
                    <p>{copy.cinematicNote}</p>
                    <BookingButton label={bookingLabel} onClick={booking} className={styles.silverButton}/>
                </div>
                <span className={styles.cinematicSide} aria-hidden="true">A STUDY IN BLACK &amp; WHITE</span>
            </section>
            <OfferIndex copy={copy} services={services} variant="cinematic"/>
        </div>
    );
}

function Atelier({ copy, services, booking, bookingLabel }: {
    copy: Copy; services: ServiceTexts; booking: () => void; bookingLabel: string;
}) {
    return (
        <div className={[styles.stage, styles.atelier].join(' ')} data-cy="design-atelier">
            <section className={styles.atelierHero} aria-labelledby="lab-atelier-h1">
                <div className={styles.atelierSide}>
                    <span>01 / 03</span>
                    <span>{copy.salon}</span>
                </div>
                <div className={styles.atelierContent}>
                    <div className={styles.atelierTitle}>
                        <p className={styles.eyebrow}>B&amp;W — {copy.detail}</p>
                        <h1 id="lab-atelier-h1">{copy.atelierLead}<br/><em>{copy.atelierFollow}</em></h1>
                        <p className={styles.atelierStatement}>{copy.atelierNote}</p>
                        <BookingButton label={bookingLabel} onClick={booking} className={styles.darkButton}/>
                    </div>
                    <div className={styles.atelierGallery}>
                        <div className={styles.atelierImagePrimary}>
                            <Image src="/images/hero/DSC_9583.jpg" alt="Wnętrze salonu Black & White"
                                fill priority sizes="(max-width: 768px) 90vw, 42vw" className={styles.coverImage}/>
                        </div>
                        <div className={styles.atelierImageSecondary}>
                            <Image src="/images/hero/DSC_9576.jpg" alt="Recepcja Black & White"
                                fill sizes="(max-width: 768px) 40vw, 18vw" className={styles.coverImage}/>
                        </div>
                        <span>BYTOM / STUDIO — 2011</span>
                    </div>
                </div>
            </section>
            <OfferIndex copy={copy} services={services} variant="atelier"/>
        </div>
    );
}

/**
 * A development-only comparative showroom. Never adds a production navigation
 * entry, never embeds invented prices, and shares the canonical booking modal.
 * The SSR guard deliberately fails closed even when a client guesses the URL.
 */
export default function DesignLab({ initialVariant }: DesignLabProps) {
    const { T, lang } = useLanguage();
    const copy = COPY[lang];
    const [variant, setVariant] = useState<DesignVariant>(initialVariant);
    const [bookingOpen, setBookingOpen] = useState(false);
    const services = T.services.items.slice(0, 3);
    const booking = () => {
        try { trackEvent('begin_checkout', { cta: 'wdi_design_lab', variant }); } catch {}
        setBookingOpen(true);
    };

    const selectVariant = (id: DesignVariant) => {
        setVariant(id);
        if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.set('variant', id);
            window.history.replaceState(window.history.state, '', url.pathname + url.search);
        }
    };

    return (
        <PublicLayout>
            <Head>
                <title>Design Studio — Black &amp; White DEV</title>
                <meta name="robots" content="noindex, nofollow, noarchive"/>
            </Head>
            <div className={styles.lab}>
                <header className={styles.labToolbar}>
                    <div className={styles.labIdentity}>
                        <p className={styles.eyebrow}>{copy.backstage}</p>
                        <h2>{copy.label}</h2>
                        <p>{copy.explanation}</p>
                    </div>
                    <div className={styles.variantPicker} role="group" aria-label={copy.direction}>
                        {VARIANTS.map((item) => (
                            <button key={item.id} type="button"
                                className={variant === item.id ? styles.variantActive : styles.variantButton}
                                onClick={() => selectVariant(item.id)}
                                aria-pressed={variant === item.id} data-cy={'variant-' + item.id}>
                                <span>{item.title}</span>
                                <small>{item.description}</small>
                            </button>
                        ))}
                    </div>
                </header>
                {variant === 'editorial' && <Editorial copy={copy} services={services}
                    booking={booking} bookingLabel={T.nav.booking}/>}
                {variant === 'cinematic' && <Cinematic copy={copy} services={services}
                    booking={booking} bookingLabel={T.nav.booking}/>}
                {variant === 'atelier' && <Atelier copy={copy} services={services}
                    booking={booking} bookingLabel={T.nav.booking}/>}
                {variant === 'immersive' && (
                    <>
                        <ImmersiveExperience locale={lang} bookingLabel={T.nav.booking} onBook={booking}/>
                        <div className={styles.immersiveOffer}>
                            <OfferIndex copy={copy} services={services} variant="immersive"/>
                        </div>
                    </>
                )}
                {variant === 'reel' && (
                    <>
                        <MotionReel locale={lang} bookingLabel={T.nav.booking} onBook={booking}/>
                        <div className={styles.immersiveOffer}>
                            <OfferIndex copy={copy} services={services} variant="reel"/>
                        </div>
                    </>
                )}
                {variant === 'orbit' && (
                    <>
                        <OrbitAtelier locale={lang} bookingLabel={T.nav.booking} onBook={booking}/>
                        <div className={styles.immersiveOffer}>
                            <OfferIndex copy={copy} services={services} variant="orbit"/>
                        </div>
                    </>
                )}
                <footer className={styles.labFooter}>
                    <span>BLACK &amp; WHITE / {BUSINESS_INFO.address.city}</span>
                    <Link href="/services">{copy.view} ↗</Link>
                    <Link href="/gallery">{copy.gallery} ↗</Link>
                </footer>
            </div>
            <BookingModal open={bookingOpen} onClose={() => setBookingOpen(false)}/>
        </PublicLayout>
    );
}

export const getServerSideProps: GetServerSideProps<DesignLabProps> = async (context) => {
    // Only the private DEV runtime exposes design studies, never production.
    // Isolated CI is allowed to screenshot this route only against the
    // explicitly pinned loopback fixture. Never enable in a public environment.
    const ciFixture = process.env.CI === 'true' &&
        process.env.WDI_DESIGN_LAB_CI === 'true' &&
        process.env.NEXT_PUBLIC_DEPLOYMENT_ENV === 'wdi-ci' &&
        process.env.API_BASE_URL === 'http://127.0.0.1:43177';
    if (process.env.APP_ENV !== 'development' && !ciFixture) return { notFound: true };
    const raw = context.query.variant;
    const requested = typeof raw === 'string' ? raw : 'editorial';
    const initialVariant: DesignVariant = requested === 'cinematic' || requested === 'atelier' || requested === 'immersive' || requested === 'reel' || requested === 'orbit'
        ? requested : 'editorial';
    return { props: { initialVariant } };
};
