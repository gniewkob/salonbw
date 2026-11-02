import { useCallback, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import ImageLightbox from '@/components/ImageLightbox';
import { SALON_GALLERY } from '@/config/content';
import styles from '@/styles/MotionReel.module.css';

type Language = 'pl' | 'en' | 'de';
interface Props { locale: string; bookingLabel: string; onBook: () => void; }
const COPY = {
    pl: {
        eyebrow: 'BLACK & WHITE / THE REEL', title: 'Sztuka ma', accent: 'wiele kadrów.',
        lead: 'Poznaj nasz świat. Przewijaj, odkrywaj i zatrzymaj się na tym, co inspiruje.',
        subtitle: 'Fotograficzny spacer po salonie', prev: 'Poprzedni kadr',
        next: 'Następny kadr', inspect: 'Otwórz fotografię', photoIndex: 'Kadr',
        gallery: 'Wszystkie zdjęcia i realizacje', catalogue: 'Usługi i ceny',
    },
    en: {
        eyebrow: 'BLACK & WHITE / THE REEL', title: 'Every story', accent: 'has a frame.',
        lead: 'Explore our world. Move through each scene and pause where you find inspiration.',
        subtitle: 'A photographic walk through the salon', prev: 'Previous frame',
        next: 'Next frame', inspect: 'Open photograph', photoIndex: 'Frame',
        gallery: 'All images and work', catalogue: 'Services and prices',
    },
    de: {
        eyebrow: 'BLACK & WHITE / THE REEL', title: 'Jede Geschichte', accent: 'hat ihren Rahmen.',
        lead: 'Entdecke unsere Welt und erlebe den Salon Bild für Bild.',
        subtitle: 'Ein fotografischer Spaziergang durch den Salon', prev: 'Vorheriges Bild',
        next: 'Nächstes Bild', inspect: 'Foto öffnen', photoIndex: 'Bild',
        gallery: 'Alle Fotos und Arbeiten', catalogue: 'Leistungen und Preise',
    },
} as const;
const REEL_ORDER = [2, 0, 5, 1, 7, 3] as const;

/** Touch-native CSS scroll snap, accessible buttons and original salon media. */
export default function MotionReel({ locale, bookingLabel, onBook }: Props) {
    const lang: Language = locale === 'en' || locale === 'de' ? locale : 'pl';
    const copy = COPY[lang];
    const trackRef = useRef<HTMLDivElement>(null);
    const [active, setActive] = useState(0);
    const [lightbox, setLightbox] = useState<number | null>(null);
    const photos = REEL_ORDER.map((i) => SALON_GALLERY[i]);

    const goTo = useCallback((index: number) => {
        const next = Math.max(0, Math.min(photos.length - 1, index));
        const root = trackRef.current;
        const target = root?.children[next] as HTMLElement | undefined;
        if (!root || !target) return;
        const reduce = typeof window !== 'undefined' &&
            window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        root.scrollTo({
            left: target.offsetLeft - root.offsetLeft,
            behavior: reduce ? 'auto' : 'smooth',
        });
        setActive(next);
    }, [photos.length]);

    const onScroll = () => {
        const root = trackRef.current;
        if (!root) return;
        const center = root.scrollLeft + root.clientWidth / 2;
        const cards = Array.from(root.children) as HTMLElement[];
        let nearest = 0;
        let distance = Number.POSITIVE_INFINITY;
        cards.forEach((card, index) => {
            const d = Math.abs(card.offsetLeft - root.offsetLeft + card.clientWidth / 2 - center);
            if (d < distance) { nearest = index; distance = d; }
        });
        setActive((current) => current === nearest ? current : nearest);
    };
    return (
        <div className={styles.reel} data-cy="design-reel">
            <section className={styles.opening} aria-labelledby="reel-heading">
                <div className={styles.openingTop}>
                    <span>{copy.eyebrow}</span><span>05 / DESIGN STUDIES</span>
                </div>
                <div className={styles.intro}>
                    <p className={styles.eyebrow}>{copy.subtitle}</p>
                    <h1 id="reel-heading">{copy.title}<em>{copy.accent}</em></h1>
                    <div className={styles.introFooter}>
                        <p>{copy.lead}</p>
                        <button className={styles.book} type="button" onClick={onBook}>
                            {bookingLabel} <span aria-hidden="true">↗</span>
                        </button>
                    </div>
                </div>
                <div className={styles.indexBar}>
                    <span aria-live="polite" aria-atomic="true" data-cy="reel-position">{String(active + 1).padStart(2, '0')} / {String(photos.length).padStart(2, '0')}</span>
                    <div className={styles.progress} aria-hidden="true">
                        <span style={{ width: ((active + 1) / photos.length) * 100 + '%' }} />
                    </div>
                    <div className={styles.controls}>
                        <button aria-label={copy.prev} type="button" disabled={active === 0}
                            onClick={() => goTo(active - 1)}>←</button>
                        <button aria-label={copy.next} type="button" disabled={active === photos.length - 1}
                            onClick={() => goTo(active + 1)}>→</button>
                    </div>
                </div>
            </section>
            <section className={styles.film} aria-label={copy.subtitle}>
                <div
                    className={styles.filmTrack}
                    ref={trackRef}
                    onScroll={onScroll}
                    data-cy="reel-track"
                    role="region"
                    aria-label={copy.subtitle}
                    tabIndex={0}
                    onKeyDown={(event) => {
                        if (event.currentTarget !== event.target) return;
                        if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
                            event.preventDefault();
                            goTo(active + (event.key === 'ArrowRight' ? 1 : -1));
                        }
                        if (event.key === 'Home' || event.key === 'End') {
                            event.preventDefault();
                            goTo(event.key === 'Home' ? 0 : photos.length - 1);
                        }
                    }}
                >
                    {photos.map((photo, index) => (
                        <article className={styles.frame} key={photo.id} data-cy="reel-frame">
                            <button className={styles.frameImage} type="button"
                                onClick={() => setLightbox(index)}
                                aria-label={copy.inspect + ': ' + photo.alt}>
                                <Image fill src={photo.image} alt={photo.alt}
                                    sizes="(max-width: 700px) 84vw, (max-width: 1200px) 56vw, 50vw"
                                    className={styles.photo}/>
                                <span className={styles.zoomSymbol} aria-hidden="true">↗</span>
                            </button>
                            <div className={styles.frameMeta}>
                                <span>{copy.photoIndex} / {String(index + 1).padStart(2, '0')}</span>
                                <h2>{photo.caption}</h2>
                            </div>
                        </article>
                    ))}
                </div>
            </section>
            <footer className={styles.afterReel}>
                <span>BLACK & WHITE / BYTOM</span>
                <div>
                    <Link href="/gallery">{copy.gallery} ↗</Link>
                    <Link href="/services">{copy.catalogue} ↗</Link>
                </div>
            </footer>
            {lightbox !== null && (
                <ImageLightbox
                    sources={photos.map((photo) => photo.image)}
                    index={lightbox}
                    alt={photos[lightbox]?.alt}
                    onClose={() => setLightbox(null)}
                    onPrev={() => setLightbox((i) => i === null ? null : (i + photos.length - 1) % photos.length)}
                    onNext={() => setLightbox((i) => i === null ? null : (i + 1) % photos.length)}
                />
            )}
        </div>
    );
}
