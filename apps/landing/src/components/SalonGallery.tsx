'use client';
import { useState, useCallback } from 'react';
import Image from 'next/image';
import { SALON_GALLERY } from '@/config/content';
import ImageLightbox from './ImageLightbox';

type GalleryImage = { id: number; image: string; caption: string; alt: string };

interface SalonGalleryProps {
    images?: GalleryImage[];
}

export default function SalonGallery({ images }: SalonGalleryProps) {
    const data = images ?? (SALON_GALLERY as unknown as GalleryImage[]);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);

    const openLightbox = useCallback((index: number) => {
        setLightboxIndex(index);
        setLightboxOpen(true);
    }, []);

    const closeLightbox = useCallback(() => {
        setLightboxOpen(false);
    }, []);

    const goToPrev = useCallback(() => {
        setLightboxIndex(
            (prev) => (prev - 1 + data.length) % data.length,
        );
    }, [data.length]);

    const goToNext = useCallback(() => {
        setLightboxIndex((prev) => (prev + 1) % data.length);
    }, [data.length]);

    return (
        <section className="py-16 bg-white dark:bg-gray-950">
            <div className="container mx-auto px-4">
                <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
                    Nasz Salon
                </h2>
                <p className="text-center text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
                    Zobacz wnętrza naszego salonu - nowoczesne, komfortowe
                    przestrzenie stworzone z myślą o Twoim relaksie i
                    zadowoleniu.
                </p>

                {/* Gallery Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {data.map((image, index) => (
                        <div
                            key={image.id}
                            className="group relative aspect-square overflow-hidden rounded-lg cursor-pointer"
                            onClick={() => openLightbox(index)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    openLightbox(index);
                                }
                            }}
                            role="button"
                            tabIndex={0}
                            aria-label={`Otwórz ${image.caption}`}
                        >
                            <Image
                                src={image.image}
                                alt={image.alt}
                                fill
                                style={{ objectFit: 'cover' }}
                                sizes="(max-width: 768px) 50vw, 25vw"
                                className="transition-transform duration-300 group-hover:scale-110"
                            />
                            {/* Overlay */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center">
                                <span className="text-white font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    {image.caption}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Lightbox */}
            {lightboxOpen && (
                <ImageLightbox
                    sources={data.map((img) => img.image)}
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
