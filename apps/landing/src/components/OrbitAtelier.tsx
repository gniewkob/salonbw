import { useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import ImageLightbox from '@/components/ImageLightbox';
import { SALON_GALLERY } from '@/config/content';
import styles from '@/styles/OrbitAtelier.module.css';

type Language = 'pl' | 'en' | 'de';
interface Props { locale: string; bookingLabel: string; onBook: () => void; }

const COPY = {
    pl: {
        label: '06 / SPATIAL ATELIER',
        title: 'Perspektywa',
        italic: 'zmienia wszystko.',
        subtitle: 'Odkryj nasz salon z innej strony.',
        description: 'Obracaj galerię, wybieraj kadr i odkrywaj detale przestrzeni Black & White.',
        previous: 'Obróć w lewo',
        next: 'Obróć w prawo',
        open: 'Powiększ wybrany kadr',
        gallery: 'Galeria i realizacje',
        services: 'Oferta i ceny',
        current: 'Aktualny kadr',
    },
    en: {
        label: '06 / SPATIAL ATELIER',
        title: 'Perspective',
        italic: 'changes everything.',
        subtitle: 'See our salon from another angle.',
        description: 'Rotate the gallery, select a frame and discover the details of Black & White.',
        previous: 'Rotate left',
        next: 'Rotate right',
        open: 'Expand selected photograph',
        gallery: 'Gallery and work',
        services: 'Services and prices',
        current: 'Selected frame',
    },
    de: {
        label: '06 / SPATIAL ATELIER',
        title: 'Perspektive',
        italic: 'verändert alles.',
        subtitle: 'Entdecke unseren Salon aus einem neuen Blickwinkel.',
        description: 'Drehe die Galerie und entdecke die Details von Black & White.',
        previous: 'Nach links drehen',
        next: 'Nach rechts drehen',
        open: 'Ausgewähltes Bild vergrößern',
        gallery: 'Galerie und Arbeiten',
        services: 'Leistungen und Preise',
        current: 'Ausgewähltes Bild',
    },
} as const;

const SELECTED = [0, 2, 7, 4, 6, 1] as const;
const ANGLE = 360 / SELECTED.length;

/** A CSS perspective scene, not an expensive WebGL dependency. */
export default function OrbitAtelier({ locale, bookingLabel, onBook }: Props) {
    const lang: Language = locale === 'en' || locale === 'de' ? locale : 'pl';
    const copy = COPY[lang];
    const [rotation, setRotation] = useState(0);
    const startPoint = useRef<{ x: number; y: number } | null>(null);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const photos = SELECTED.map((i) => SALON_GALLERY[i]);
    const normalized = ((rotation % photos.length) + photos.length) % photos.length;
    const current = photos[normalized];

    const stageStyle = { '--orbit-rotation': String(-rotation * ANGLE) + 'deg' } as CSSProperties;

    // A horizontal touch gesture rotates one card; vertical gestures stay native.
    const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
        const start = startPoint.current;
        startPoint.current = null;
        if (!start || event.pointerType !== 'touch') return;
        const dx = event.clientX - start.x;
        const dy = event.clientY - start.y;
        if (Math.abs(dx) < 55 || Math.abs(dx) <= Math.abs(dy) * 1.3) return;
        setRotation((previous) => previous + (dx < 0 ? 1 : -1));
    };

    return (
        <div className={styles.atelier} data-cy="design-orbit">
            <section className={styles.opening} aria-labelledby="orbit-heading">
                <div className={styles.top}>
                    <span>BLACK & WHITE / BYTOM</span><span>{copy.label}</span>
                </div>
                <div className={styles.headline}>
                    <p>{copy.subtitle}</p>
                    <h1 id="orbit-heading">{copy.title}<em>{copy.italic}</em></h1>
                </div>
            </section>
            <section className={styles.scene} aria-label={copy.description}>
                <div className={styles.artwork} aria-hidden="true">B/W</div>
                <div
                    className={styles.perspective}
                    data-cy="orbit-gesture"
                    role="group"
                    aria-label={copy.description}
                    tabIndex={0}
                    onPointerDown={(event) => {
                        if (event.pointerType === 'touch') {
                            startPoint.current = { x: event.clientX, y: event.clientY };
                        }
                    }}
                    onPointerUp={onPointerUp}
                    onPointerCancel={() => { startPoint.current = null; }}
                    onKeyDown={(event) => {
                        if (event.currentTarget !== event.target) return;
                        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                            event.preventDefault();
                            setRotation((previous) => previous + (event.key === 'ArrowRight' ? 1 : -1));
                        }
                    }}
                >
                    <div className={styles.orbit} style={stageStyle} data-cy="orbit-wheel">
                        {photos.map((photo, index) => (
                            <div
                                className={styles.card}
                                key={photo.id}
                                style={{ '--card-angle': String(index * ANGLE) + 'deg' } as CSSProperties}
                                aria-hidden="true"
                            >
                                <Image
                                    src={photo.image}
                                    alt=""
                                    fill
                                    priority={index === 0}
                                    sizes="(max-width: 600px) 50vw, 340px"
                                    className={styles.photo}
                                />
                                <span>{String(index + 1).padStart(2, '0')} / B&W</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className={styles.sceneControls}>
                    <button
                        type="button"
                        onClick={() => setRotation((r) => r - 1)}
                        aria-label={copy.previous}
                        data-cy="orbit-prev"
                    >←</button>
                    <span aria-live="polite" aria-atomic="true" data-cy="orbit-position">
                        {String(normalized + 1).padStart(2, '0')} / {String(photos.length).padStart(2, '0')}
                    </span>
                    <button
                        type="button"
                        onClick={() => setRotation((r) => r + 1)}
                        aria-label={copy.next}
                        data-cy="orbit-next"
                    >→</button>
                </div>
            </section>
            <section className={styles.details} aria-labelledby="orbit-selected">
                <div className={styles.caption}>
                    <p>{copy.current}</p>
                    <h2 id="orbit-selected">{current.caption}</h2>
                    <p>{copy.description}</p>
                    <button type="button" className={styles.inspect}
                        onClick={() => setLightboxOpen(true)}>
                        {copy.open} <span aria-hidden="true">↗</span>
                    </button>
                </div>
                <div className={styles.links}>
                    <Link href="/gallery">{copy.gallery} ↗</Link>
                    <Link href="/services">{copy.services} ↗</Link>
                    <button type="button" onClick={onBook} className={styles.book}>
                        {bookingLabel} ↗
                    </button>
                </div>
            </section>
            {lightboxOpen && (
                <ImageLightbox
                    sources={photos.map((photo) => photo.image)}
                    index={normalized}
                    alt={current.alt}
                    onPrev={() => setRotation((r) => r - 1)}
                    onNext={() => setRotation((r) => r + 1)}
                    onClose={() => setLightboxOpen(false)}
                />
            )}
        </div>
    );
}
