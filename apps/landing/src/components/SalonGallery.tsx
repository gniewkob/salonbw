'use client';
import { useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { SALON_GALLERY } from '@/config/content';
import ImageLightbox from './ImageLightbox';

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
        <section className="py-20 md:py-28" style={{ background: '#ffffff' }}>
            <div className="container mx-auto px-4 md:px-8">
                <div className="text-center mb-14">
                    <p className="text-xs tracking-widest uppercase mb-3" style={{ color: '#c5a880', letterSpacing: '0.22em', fontFamily: "'Open Sans', sans-serif" }}>
                        Zajrzyj do nas
                    </p>
                    <h2 className="text-3xl md:text-4xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: '#0d0d0d' }}>
                        Nasz salon
                    </h2>
                    <div className="mx-auto mt-4 mb-4" style={{ width: '40px', height: '2px', background: '#c5a880' }} />
                    <p className="text-sm max-w-lg mx-auto" style={{ color: '#8a7060' }}>
                        Nowoczesna przestrzeń stworzona z myślą o Twoim komforcie i relaksie.
                    </p>
                </div>

                {/* Masonry-style CSS grid */}
                <div
                    className="hidden md:grid"
                    style={{
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gridAutoRows: '200px',
                        gap: '10px',
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
                                    borderRadius: '3px',
                                }}
                                onClick={() => openLightbox(index)}
                                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(index); } }}
                                role="button"
                                tabIndex={0}
                                aria-label={`Otwórz ${image.caption}`}
                            >
                                <Image
                                    src={image.image}
                                    alt={image.alt}
                                    fill
                                    style={{ objectFit: 'cover', transition: 'transform 0.5s ease' }}
                                    sizes="(max-width: 768px) 50vw, 25vw"
                                    className="group-hover:scale-105"
                                />
                                <div
                                    className="absolute inset-0 flex items-end p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                    style={{ background: 'linear-gradient(to top, rgba(13,13,13,0.7) 0%, transparent 60%)' }}
                                >
                                    <span className="text-white text-sm font-medium tracking-wide">{image.caption}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Mobile: simple 2-col grid */}
                <div className="md:hidden grid grid-cols-2 gap-2">
                    {data.map((image, index) => (
                        <div
                            key={image.id}
                            className="group relative aspect-square overflow-hidden cursor-pointer"
                            style={{ borderRadius: '3px' }}
                            onClick={() => openLightbox(index)}
                            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(index); } }}
                            role="button"
                            tabIndex={0}
                            aria-label={`Otwórz ${image.caption}`}
                        >
                            <Image
                                src={image.image}
                                alt={image.alt}
                                fill
                                style={{ objectFit: 'cover' }}
                                sizes="50vw"
                                className="group-hover:scale-105 transition-transform duration-300"
                            />
                        </div>
                    ))}
                </div>

                <div className="text-center mt-10">
                    <Link
                        href="/gallery"
                        className="inline-block px-8 py-3.5 text-xs font-semibold tracking-widest uppercase transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#c5a880] focus:ring-offset-2"
                        style={{ border: '1px solid #0d0d0d', color: '#0d0d0d', borderRadius: '2px', letterSpacing: '0.16em' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#0d0d0d'; e.currentTarget.style.color = '#fff'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#0d0d0d'; }}
                    >
                        Zobacz pełną galerię
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
