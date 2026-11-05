import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import ImageLightbox from '@/components/ImageLightbox';
import { SALON_GALLERY } from '@/config/content';
import styles from '@/styles/ImmersiveExperience.module.css';

type Locale = 'pl' | 'en' | 'de';

interface Props {
    locale: string;
    bookingLabel: string;
    onBook: () => void;
}

const COPY = {
    pl: {
        eyebrow: 'BLACK & WHITE / BYTOM',
        headline: 'Zobacz włosy',
        accent: 'inaczej.',
        statement: 'Każdy detal ma znaczenie.',
        intro: 'Poznaj przestrzeń, w której kolor, forma i pielęgnacja spotykają się z indywidualnym stylem.',
        explore: 'Przewiń, by odkryć',
        work: '01 / Nasz świat',
        workTitle: 'Nie tylko fryzura.',
        workAccent: 'Całe doświadczenie.',
        workDescription: 'Prawdziwe kadry z Black & White. Zajrzyj do środka, zobacz detale i poczuj atmosferę salonu.',
        viewPhoto: 'Powiększ zdjęcie',
        instagram: 'Zobacz realizacje w galerii',
        offer: 'Odkryj usługi i ceny',
        closer: 'Twój kolejny rozdział zaczyna się tutaj.',
        note: 'Fotografie wnętrza salonu. Realizacje fryzjerskie zobaczysz w galerii.',
    },
    en: {
        eyebrow: 'BLACK & WHITE / BYTOM',
        headline: 'See hair',
        accent: 'differently.',
        statement: 'Every detail has a purpose.',
        intro: 'Step into the space where colour, shape and care meet personal style.',
        explore: 'Scroll to explore',
        work: '01 / Our world',
        workTitle: 'More than a style.',
        workAccent: 'An experience.',
        workDescription: 'Real moments from Black & White. Explore the space and discover its atmosphere.',
        viewPhoto: 'Expand photo',
        instagram: 'Explore our work in the gallery',
        offer: 'Discover services and prices',
        closer: 'Your next chapter starts here.',
        note: 'Original salon photographs. Find hairstyle results in our gallery.',
    },
    de: {
        eyebrow: 'BLACK & WHITE / BYTOM',
        headline: 'Haare neu',
        accent: 'entdecken.',
        statement: 'Jedes Detail zählt.',
        intro: 'Entdecke einen Ort, an dem Farbe, Form und Pflege auf individuellen Stil treffen.',
        explore: 'Scrollen und entdecken',
        work: '01 / Unsere Welt',
        workTitle: 'Mehr als eine Frisur.',
        workAccent: 'Ein Erlebnis.',
        workDescription: 'Echte Eindrücke aus Black & White. Entdecke unseren Salon und seine Atmosphäre.',
        viewPhoto: 'Bild vergrößern',
        instagram: 'Unsere Arbeiten in der Galerie',
        offer: 'Leistungen und Preise ansehen',
        closer: 'Dein nächstes Kapitel beginnt hier.',
        note: 'Originalfotos aus dem Salon. Frisuren und Ergebnisse findest du in der Galerie.',
    },
} as const;

const PHOTO_COMPOSITION = [0, 4, 2, 6, 3, 7] as const;

/**
 * An immersive, content-first DEV design study.
 * The image pull-back is driven by scroll progress without an extra animation
 * dependency; SSR content, booking and gallery remain fully usable without JS.
 */
export default function ImmersiveExperience({ locale, bookingLabel, onBook }: Props) {
    const language: Locale = locale === 'en' || locale === 'de' ? locale : 'pl';
    const copy = COPY[language];
    const sequenceRef = useRef<HTMLElement>(null);
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    const photos = PHOTO_COMPOSITION.map((index) => SALON_GALLERY[index]);

    useEffect(() => {
        const scene = sequenceRef.current;
        if (!scene || typeof window.matchMedia !== 'function' || typeof window.requestAnimationFrame !== 'function') {
            return;
        }

        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        let frame = 0;

        const update = () => {
            frame = 0;
            if (reducedMotion.matches) {
                scene.style.setProperty('--experience-progress', '0');
                return;
            }
            const rect = scene.getBoundingClientRect();
            const distance = Math.max(1, rect.height - window.innerHeight);
            const progress = Math.min(1, Math.max(0, -rect.top / distance));
            scene.style.setProperty('--experience-progress', String(progress));
        };

        const schedule = () => {
            if (frame === 0) frame = window.requestAnimationFrame(update);
        };
        update();
        window.addEventListener('scroll', schedule, { passive: true });
        window.addEventListener('resize', schedule);
        reducedMotion.addEventListener?.('change', schedule);
        return () => {
            window.removeEventListener('scroll', schedule);
            window.removeEventListener('resize', schedule);
            reducedMotion.removeEventListener?.('change', schedule);
            if (frame) window.cancelAnimationFrame(frame);
        };
    }, []);

    const closeLightbox = () => setLightboxIndex(null);

    return (
        <div className={styles.experience} data-cy="design-immersive">
            <section className={styles.scrollSequence} ref={sequenceRef} aria-labelledby="immersive-title" data-cy="immersive-scroll-sequence">
                <div className={styles.stickyScreen}>
                    <div className={styles.zoomFrame}>
                        <Image
                            src="/images/hero/DSC_9584.jpg"
                            alt={language === 'pl' ? 'Autentyczne wnętrze salonu fryzjerskiego Black & White' : 'Black & White hair salon interior'}
                            fill
                            priority
                            sizes="100vw"
                            className={styles.heroPhoto}
                        />
                        <div className={styles.heroShade} aria-hidden="true" />
                    </div>
                    <div className={styles.frameContent}>
                        <div className={styles.frameTop}>
                            <span>{copy.eyebrow}</span>
                            <span>THE EXPERIENCE / 04</span>
                        </div>
                        <div className={styles.frameCenter}>
                            <span className={styles.frameStatement}>{copy.statement}</span>
                            <h1 id="immersive-title">
                                {copy.headline}
                                <em>{copy.accent}</em>
                            </h1>
                            <p>{copy.intro}</p>
                            <button type="button" onClick={onBook} className={styles.heroBooking}>
                                {bookingLabel} <span aria-hidden="true">↗</span>
                            </button>
                        </div>
                        <div className={styles.frameBottom}>
                            <span>{copy.explore}</span>
                            <span className={styles.scrollIndicator} aria-hidden="true">↓</span>
                            <span>01 — 03</span>
                        </div>
                    </div>
                </div>
            </section>

            <section className={styles.gallerySection} aria-labelledby="immersive-gallery-heading">
                <div className={styles.galleryIntro}>
                    <span className={styles.kicker}>{copy.work}</span>
                    <h2 id="immersive-gallery-heading">
                        {copy.workTitle}
                        <em>{copy.workAccent}</em>
                    </h2>
                    <p>{copy.workDescription}</p>
                </div>
                <div className={styles.photoWall} data-cy="immersive-photo-wall">
                    {photos.map((photo, index) => (
                        <button
                            type="button"
                            key={photo.id}
                            className={styles.photoTile}
                            data-position={index}
                            onClick={() => setLightboxIndex(index)}
                            aria-label={copy.viewPhoto + ': ' + photo.alt}
                        >
                            <Image
                                src={photo.image}
                                alt={photo.alt}
                                fill
                                sizes="(max-width: 600px) 90vw, (max-width: 1024px) 46vw, 32vw"
                                className={styles.tilePhoto}
                            />
                            <span className={styles.photoCaption}>
                                <span>0{index + 1} / {photo.caption}</span>
                                <span aria-hidden="true">↗</span>
                            </span>
                        </button>
                    ))}
                </div>
                <p className={styles.galleryNote}>{copy.note}</p>
                <div className={styles.galleryLinks}>
                    <Link href="/gallery" className={styles.outlineLink}>{copy.instagram} <span aria-hidden="true">↗</span></Link>
                    <Link href="/services" className={styles.outlineLink}>{copy.offer} <span aria-hidden="true">↗</span></Link>
                </div>
            </section>

            <section className={styles.finalScene}>
                <div>
                    <span className={styles.kicker}>BLACK & WHITE — BYTOM</span>
                    <h2>{copy.closer}</h2>
                    <button type="button" onClick={onBook} className={styles.finalBooking}>
                        {bookingLabel} <span aria-hidden="true">↗</span>
                    </button>
                </div>
            </section>

            {lightboxIndex !== null && (
                <ImageLightbox
                    sources={photos.map((photo) => photo.image)}
                    index={lightboxIndex}
                    alt={photos[lightboxIndex]?.alt}
                    onClose={closeLightbox}
                    onPrev={() => setLightboxIndex((index) => index === null ? null : (index - 1 + photos.length) % photos.length)}
                    onNext={() => setLightboxIndex((index) => index === null ? null : (index + 1) % photos.length)}
                />
            )}
        </div>
    );
}
