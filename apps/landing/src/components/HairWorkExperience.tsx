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
        alt: 'Miedziane włosy ułożone w miękkie fale',
        category: '01 / COLOUR',
    },
    {
        src: '/images/hair-portfolio/cool-blonde.jpg',
        alt: 'Wielowymiarowy chłodny blond i miękkie fale',
        category: '02 / BLOND',
    },
    {
        src: '/images/hair-portfolio/textured-updo.jpg',
        alt: 'Eleganckie, teksturowane upięcie włosów',
        category: '03 / FORM',
    },
    {
        src: '/images/hair-portfolio/blonde-waves.jpg',
        alt: 'Długie blond włosy ułożone w naturalne fale',
        category: '04 / TEXTURE',
    },
    {
        src: '/images/hair-portfolio/formal-updo.jpg',
        alt: 'Uroczyste upięcie blond z delikatnymi ozdobami',
        category: '05 / DETAIL',
    },
    {
        src: '/images/hair-portfolio/soft-blonde.jpg',
        alt: 'Jasny, gładki blond widziany od tyłu',
        category: '06 / LIGHT',
    },
    {
        src: '/images/hair-portfolio/blonde-shine.jpg',
        alt: 'Lśniący blond z gładkim wykończeniem',
        category: '07 / CRAFT',
    },
] as const;

const COPY = {
    pl: {
        overline: 'BLACK & WHITE / THE ART OF HAIR',
        location: 'BYTOM · AKADEMIA ZDROWYCH WŁOSÓW',
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
                        <span className={styles.chapter}>01 — ART DIRECTION</span>
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
                        <span>EST. 2011</span>
                        <span>HAIR AS AN ART FORM</span>
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
                            alt={PHOTOS[0].alt}
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
                            aria-label={copy.open + ': ' + photo.alt}
                        >
                            <span className={styles.photoFrame}>
                                <Image
                                    src={photo.src}
                                    alt={photo.alt}
                                    fill
                                    sizes="(max-width: 768px) 88vw, (max-width: 1100px) 44vw, 28vw"
                                    className={styles.image}
                                />
                            </span>
                            <span className={styles.photoMeta}>
                                <span>{photo.category}</span>
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
                    alt={PHOTOS[selected].alt}
                />
            )}
        </div>
    );
}
