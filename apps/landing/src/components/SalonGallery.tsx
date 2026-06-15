import { useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { SALON_GALLERY } from '@/config/content';
import ImageLightbox from './ImageLightbox';
import SectionHeader from './SectionHeader';
import { useLanguage } from '@/contexts/LanguageContext';
import { translateGalleryCaption } from '@/i18n/catalogNames';

type GalleryImage = { id: number; image: string; caption: string; alt: string };
interface SalonGalleryProps { images?: GalleryImage[]; }

// Masonry layout: assigns a span value to each cell (1 or 2 rows/cols)
const GRID_SPANS = [
    { col: 1, row: 2 }, // salon1 — tall left
    { col: 1, row: 1 }, // salon2
    { col: 1, row: 1 }, // salon3
    { col: 2, row: 1 }, // salon4 — wide
    { col: 1, row: 1 }, // salon5
    { col: 1, row: 2 }, // salon6 — tall right
    { col: 1, row: 1 }, // salon7
    { col: 1, row: 1 }, // salon8
];

export default function SalonGallery({ images }: SalonGalleryProps) {
    const data = images ?? (SALON_GALLERY as unknown as GalleryImage[]);
    const { T, lang } = useLanguage();
    const g = T.salonGallery;
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);

    const openLightbox = useCallback((index: number) => {
        setLightboxIndex(index);
        setLightboxOpen(true);
    }, []);

    const closeLightbox = useCallback(() => setLightboxOpen(false), []);
    const goToPrev = useCallback(() => setLightboxIndex(p => (p - 1 + data.length) % data.length), [data.length]);
    const goToNext = useCallback(() => setLightboxIndex(p => (p + 1) % data.length), [data.length]);

    return (
        <section className="py-20 md:py-28" style={{ background: '#0d0d0d' }}>
            <div className="container mx-auto px-4 md:px-8">
                <SectionHeader
                    eyebrow={g.eyebrow}
                    title={g.title}
                    subtitle={g.subtitle}
                    dark
                />

                {/* Masonry-style CSS grid */}
                <div
                    className="hidden md:grid"
                    style={{
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gridAutoRows: '220px',
                        gap: '6px',
                    }}
                >
                    {data.map((image, index) => {
                        const span = GRID_SPANS[index] ?? { col: 1, row: 1 };
                        return (
                            <div
                                key={image.id}
                                className="group relative overflow-hidden cursor-pointer"
                                style={{
                                    gridColumn: `span ${span.col}`,
                                    gridRow: `span ${span.row}`,
                                    borderRadius: '2px',
                                }}
                                onClick={() => openLightbox(index)}
                                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(index); } }}
                                role="button"
                                tabIndex={0}
                                aria-label={`${g.open} ${translateGalleryCaption(image.caption, lang)}`}
                            >
                                <Image
                                    src={image.image}
                                    alt={image.alt}
                                    fill
                                    style={{ objectFit: 'cover' }}
                                    sizes="(max-width: 768px) 50vw, 25vw"
                                    className="gallery-img"
                                />
                                <div className="gallery-blend" aria-hidden="true" />
                                <div className="gallery-caption">
                                    <span className="gallery-caption__accent" />
                                    <span className="gallery-caption__text">{translateGalleryCaption(image.caption, lang)}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Mobile: simple 2-col grid */}
                <div className="md:hidden grid grid-cols-2 gap-0.5">
                    {data.map((image, index) => (
                        <div
                            key={image.id}
                            className="group relative aspect-square overflow-hidden cursor-pointer"
                            style={{ borderRadius: '2px' }}
                            onClick={() => openLightbox(index)}
                            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(index); } }}
                            role="button"
                            tabIndex={0}
                            aria-label={`${g.open} ${translateGalleryCaption(image.caption, lang)}`}
                        >
                            <Image
                                src={image.image}
                                alt={image.alt}
                                fill
                                style={{ objectFit: 'cover' }}
                                sizes="50vw"
                                className="gallery-img"
                            />
                            <div className="gallery-blend" aria-hidden="true" />
                        </div>
                    ))}
                </div>

                <div className="text-center mt-10">
                    <Link
                        href="/gallery"
                        className="btn-outline-white inline-block px-8 py-3.5 text-xs font-semibold uppercase focus:outline-none focus:ring-2 focus:ring-[#b4b8be] focus:ring-offset-2 focus:ring-offset-[#0d0d0d]"
                        style={{ borderRadius: '2px', letterSpacing: '0.16em' }}
                    >
                        {g.viewAll}
                    </Link>
                </div>
            </div>

            {lightboxOpen && (
                <ImageLightbox
                    sources={data.map(img => img.image)}
                    index={lightboxIndex}
                    alt={data[lightboxIndex]?.alt}
                    onClose={closeLightbox}
                    onPrev={goToPrev}
                    onNext={goToNext}
                />
            )}
        </section>
    );
}
