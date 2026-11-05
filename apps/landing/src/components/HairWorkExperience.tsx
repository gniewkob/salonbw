import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import ImageLightbox from '@/components/ImageLightbox';
import styles from '@/styles/HairWorkExperience.module.css';

type Language = 'pl' | 'en' | 'de';
interface Props {
    locale: string;
    bookingLabel: string;
    onBook: () => void;
}

const PHOTOS = [
    {
        src: '/images/hair-portfolio/copper-waves.jpg',
        alt: {
            pl: 'Miedziane włosy ułożone w miękkie fale',
            en: 'Copper-coloured hair styled in loose waves',
            de: 'Kupferfarbenes Haar mit weichen Wellen',
        },
        category: {
            pl: '01 / KOLOR',
            en: '01 / COLOUR',
            de: '01 / FARBE',
        },
    },
    {
        src: '/images/hair-portfolio/cool-blonde.jpg',
        alt: {
            pl: 'Wielowymiarowy chłodny blond i miękkie fale',
            en: 'Cool dimensional blonde with soft waves',
            de: 'Kühles facettenreiches Blond mit weichen Wellen',
        },
        category: {
            pl: '02 / BLOND',
            en: '02 / BLONDE',
            de: '02 / BLOND',
        },
    },
    {
        src: '/images/hair-portfolio/textured-updo.jpg',
        alt: {
            pl: 'Eleganckie, teksturowane upięcie włosów',
            en: 'Elegant textured updo hairstyle',
            de: 'Elegante Hochsteckfrisur mit Struktur',
        },
        category: {
            pl: '03 / UPIĘCIE',
            en: '03 / UPDO',
            de: '03 / HOCHSTECKFRISUR',
        },
    },
    {
        src: '/images/hair-portfolio/blonde-waves.jpg',
        alt: {
            pl: 'Długie blond włosy ułożone w naturalne fale',
            en: 'Long blonde hair styled in natural waves',
            de: 'Langes blondes Haar in natürlichen Wellen',
        },
        category: {
            pl: '04 / TEKSTURA',
            en: '04 / TEXTURE',
            de: '04 / STRUKTUR',
        },
    },
    {
        src: '/images/hair-portfolio/formal-updo.jpg',
        alt: {
            pl: 'Uroczyste upięcie blond z delikatnymi ozdobami',
            en: 'Formal blonde updo with delicate accessories',
            de: 'Festliche blonde Hochsteckfrisur mit dezentem Haarschmuck',
        },
        category: {
            pl: '05 / DETAL',
            en: '05 / DETAIL',
            de: '05 / DETAIL',
        },
    },
    {
        src: '/images/hair-portfolio/soft-blonde.jpg',
        alt: {
            pl: 'Jasny, gładki blond widziany od tyłu',
            en: 'Smooth light blonde hairstyle viewed from behind',
            de: 'Glattes hellblondes Haar von hinten',
        },
        category: {
            pl: '06 / ŚWIATŁO',
            en: '06 / LIGHT',
            de: '06 / LICHT',
        },
    },
    {
        src: '/images/hair-portfolio/blonde-shine.jpg',
        alt: {
            pl: 'Lśniący blond z gładkim wykończeniem',
            en: 'Shiny blonde hair with a sleek finish',
            de: 'Glänzendes blondes Haar mit glattem Finish',
        },
        category: {
            pl: '07 / POŁYSK',
            en: '07 / SHINE',
            de: '07 / GLANZ',
        },
    },
] as const;;

const COPY = {
    pl: {
        overline: 'BLACK & WHITE / THE ART OF HAIR',
        location: 'BYTOM · AKADEMIA ZDROWYCH WŁOSÓW',
        heroChapter: '01 — KOLORYZACJA I STYLIZACJA',
        footerFounded: 'OD 2011',
        footerMotto: 'KOLOR · FORMA · ŚWIATŁO',
        heroLineOne: 'Włosy, które',
        heroLineTwo: 'mówią za siebie.',
        introduction:
            'Kolor. Forma. Światło. Zobacz autentyczne realizacje wykonane w naszym salonie. Bez zbędnych obietnic — liczy się efekt.',
        explore: 'Odkryj nasze realizacje',
        heroLabel: 'Miedź / koloryzacja',
        heroPhoto: 'Otwórz fotografię miedzianej koloryzacji',
        index: '01 / 07',
        collectionEyebrow: 'PORTFOLIO / WYBRANE PRACE',
        collectionTitle: 'Każda fryzura ma własny charakter.',
        collectionLead:
            'Wybraliśmy kilka różnych realizacji: od subtelnych blondów, przez mocną miedź, po upięcia z detalem. Każde zdjęcie pochodzi z naszych publikacji.',
        open: 'Powiększ realizację',
        discoverMore: 'Pełna galeria naszych prac',
        sectionName: 'Od inspiracji do wizyty',
        ctaTitle: 'Twoja kolej na coś wyjątkowego.',
        ctaDescription:
            'Wybierz usługę, sprawdź aktualną ofertę i zarezerwuj dogodny termin.',
        services: 'Usługi i ceny',
    },
    en: {
        overline: 'BLACK & WHITE / THE ART OF HAIR',
        location: 'BYTOM · HEALTHY HAIR ACADEMY',
        heroChapter: '01 — COLOUR & STYLING',
        footerFounded: 'EST. 2011',
        footerMotto: 'COLOUR · FORM · LIGHT',
        heroLineOne: 'Hair that',
        heroLineTwo: 'speaks for itself.',
        introduction:
            'Colour. Shape. Light. Explore actual work from our salon. No empty promises — let the results speak.',
        explore: 'Explore our work',
        heroLabel: 'Copper / colour',
        heroPhoto: 'Open copper-colour hair photograph',
        index: '01 / 07',
        collectionEyebrow: 'PORTFOLIO / SELECTED WORK',
        collectionTitle: 'Every hairstyle has its own character.',
        collectionLead:
            'A selection of real salon work, from dimensional blondes and vivid copper to intricate updos. Every photograph comes from our published gallery.',
        open: 'Enlarge hairstyle photograph',
        discoverMore: 'See the complete gallery',
        sectionName: 'From inspiration to appointment',
        ctaTitle: 'Ready for a look of your own?',
        ctaDescription: 'Explore our current services and book a suitable appointment.',
        services: 'Services and prices',
    },
    de: {
        overline: 'BLACK & WHITE / THE ART OF HAIR',
        location: 'BYTOM · AKADEMIE FÜR GESUNDES HAAR',
        heroChapter: '01 — FARBE & STYLING',
        footerFounded: 'SEIT 2011',
        footerMotto: 'FARBE · FORM · LICHT',
        heroLineOne: 'Haare, die',
        heroLineTwo: 'für sich sprechen.',
        introduction:
            'Farbe. Form. Licht. Entdecke echte Arbeiten aus unserem Salon. Nicht Versprechen, sondern Ergebnisse stehen im Mittelpunkt.',
        explore: 'Unsere Arbeiten entdecken',
        heroLabel: 'Kupfer / Coloration',
        heroPhoto: 'Fotografie einer kupferfarbenen Coloration öffnen',
        index: '01 / 07',
        collectionEyebrow: 'PORTFOLIO / AUSGEWÄHLTE ARBEITEN',
        collectionTitle: 'Jede Frisur hat ihren eigenen Charakter.',
        collectionLead:
            'Eine Auswahl echter Salonarbeiten: von facettenreichen Blondtönen über leuchtendes Kupfer bis zu aufwendigen Hochsteckfrisuren.',
        open: 'Frisurfoto vergrößern',
        discoverMore: 'Die gesamte Galerie ansehen',
        sectionName: 'Von der Inspiration zum Termin',
        ctaTitle: 'Jetzt ist dein eigener Look dran.',
        ctaDescription:
            'Entdecke unsere Leistungen und buche einen passenden Termin.',
        services: 'Leistungen und Preise',
    },
} as const;

export default function HairWorkExperience({
    locale,
    bookingLabel,
    onBook,
}: Props) {
    const lang: Language = locale === 'en' || locale === 'de' ? locale : 'pl';
    const copy = COPY[lang];
    const [selected, setSelected] = useState<number | null>(null);
    const sources = PHOTOS.map((photo) => photo.src);

    return (
        <div className={styles.experience} data-cy="design-hairwork">
            <section className={styles.hero} aria-labelledby="hairwork-heading">
                <div className={styles.heroCopy}>
                    <div className={styles.heroTopline}>
                        <span>{copy.overline}</span>
                        <span>{copy.location}</span>
                    </div>
                    <div className={styles.heroBody}>
                        <span className={styles.chapter}>{copy.heroChapter}</span>
                        <h1 id="hairwork-heading">
                            {copy.heroLineOne}
                            <br />
                            <em>{copy.heroLineTwo}</em>
                        </h1>
                        <p>{copy.introduction}</p>
                        <div className={styles.heroActions}>
                            <button
                                type="button"
                                className={styles.primaryButton}
                                onClick={onBook}
                            >
                                {bookingLabel}
                                <span aria-hidden="true"> ↗</span>
                            </button>
                            <a
                                className={styles.textLink}
                                href="#hairwork-collection"
                            >
                                {copy.explore}
                                <span aria-hidden="true"> ↓</span>
                            </a>
                        </div>
                    </div>
                    <div className={styles.heroFootnote}>
                        <span>{copy.footerFounded}</span>
                        <span>{copy.footerMotto}</span>
                    </div>
                </div>
                <div className={styles.heroMedia}>
                    <button
                        type="button"
                        className={styles.heroPhoto}
                        onClick={() => setSelected(0)}
                        aria-label={copy.heroPhoto}
                        data-cy="hairwork-hero-photo"
                    >
                        <Image
                            src={PHOTOS[0].src}
                            alt={PHOTOS[0].alt[lang]}
                            fill
                            priority
                            sizes="(max-width: 768px) 100vw, 54vw"
                            className={styles.image}
                        />
                    </button>
                    <div className={styles.heroPhotoCaption}>
                        <span>{copy.heroLabel}</span>
                        <span>{copy.index}</span>
                    </div>
                </div>
            </section>
            <section
                className={styles.collection}
                id="hairwork-collection"
                aria-labelledby="hairwork-collection-title"
            >
                <div className={styles.collectionIntro}>
                    <div>
                        <p className={styles.chapter}>
                            {copy.collectionEyebrow}
                        </p>
                        <h2 id="hairwork-collection-title">
                            {copy.collectionTitle}
                        </h2>
                    </div>
                    <div className={styles.introAside}>
                        <p>{copy.collectionLead}</p>
                        <Link href="/gallery" className={styles.textLink}>
                            {copy.discoverMore}
                            <span aria-hidden="true"> ↗</span>
                        </Link>
                    </div>
                </div>
                <div className={styles.photoGrid} data-cy="hairwork-gallery">
                    {PHOTOS.slice(1).map((photo, index) => (
                        <button
                            key={photo.src}
                            className={styles.photoCard}
                            type="button"
                            data-cy="hairwork-photo"
                            onClick={() => setSelected(index + 1)}
                            aria-label={copy.open + ': ' + photo.alt[lang]}
                        >
                            <span className={styles.photoFrame}>
                                <Image
                                    src={photo.src}
                                    alt={photo.alt[lang]}
                                    fill
                                    sizes="(max-width: 768px) 88vw, (max-width: 1100px) 44vw, 28vw"
                                    className={styles.image}
                                />
                            </span>
                            <span className={styles.photoMeta}>
                                <span>{photo.category[lang]}</span>
                                <span aria-hidden="true"> ↗</span>
                            </span>
                        </button>
                    ))}
                </div>
            </section>
            <section className={styles.finalChapter}>
                <div>
                    <p className={styles.chapter}>{copy.sectionName}</p>
                    <h2>{copy.ctaTitle}</h2>
                    <p>{copy.ctaDescription}</p>
                </div>
                <div className={styles.finalActions}>
                    <button
                        type="button"
                        className={styles.primaryButton}
                        onClick={onBook}
                    >
                        {bookingLabel} <span aria-hidden="true">↗</span>
                    </button>
                    <Link href="/services" className={styles.textLink}>
                        {copy.services} <span aria-hidden="true">↗</span>
                    </Link>
                </div>
            </section>
            {selected !== null && (
                <ImageLightbox
                    sources={sources}
                    index={selected}
                    onClose={() => setSelected(null)}
                    onPrev={() =>
                        setSelected((current) =>
                            current === null
                                ? null
                                : (current + PHOTOS.length - 1) % PHOTOS.length,
                        )
                    }
                    onNext={() =>
                        setSelected((current) =>
                            current === null
                                ? null
                                : (current + 1) % PHOTOS.length,
                        )
                    }
                    alt={PHOTOS[selected].alt[lang]}
                />
            )}
        </div>
    );
}
