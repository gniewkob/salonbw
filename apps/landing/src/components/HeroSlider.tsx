'use client';
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { HERO_SLIDES, BUSINESS_INFO } from '@/config/content';
import { getPanelUrl } from '@/utils/panelUrl';

type HeroSlide = { id: number; title: string; description: string; image: string; alt: string };

interface HeroSliderProps {
    slides?: HeroSlide[];
}

export default function HeroSlider({ slides }: HeroSliderProps) {
    const data = slides ?? (HERO_SLIDES as unknown as HeroSlide[]);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);

    // Booking requires login - redirect to panel with return URL
    const bookingUrl = getPanelUrl(
        `/auth/login?redirect=${encodeURIComponent('/appointments')}`
    );

    const nextSlide = useCallback(() => {
        setCurrentSlide((prev) => (prev + 1) % data.length);
    }, [data.length]);

    const prevSlide = useCallback(() => {
        setCurrentSlide(
            (prev) => (prev - 1 + data.length) % data.length,
        );
    }, [data.length]);

    const goToSlide = useCallback((index: number) => {
        setCurrentSlide(index);
        setIsAutoPlaying(false);
    }, []);

    // Auto-play slides every 5 seconds
    useEffect(() => {
        if (!isAutoPlaying) return;
        const interval = setInterval(nextSlide, 5000);
        return () => clearInterval(interval);
    }, [isAutoPlaying, nextSlide]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') {
                prevSlide();
                setIsAutoPlaying(false);
            } else if (e.key === 'ArrowRight') {
                nextSlide();
                setIsAutoPlaying(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [nextSlide, prevSlide]);

    return (
        <section
            className="relative h-[500px] md:h-[600px] overflow-hidden"
            aria-label="Hero slider"
        >
            {/* Slides */}
            <div className="relative w-full h-full">
                {data.map((slide, index) => (
                    <div
                        key={slide.id}
                        className={`absolute inset-0 transition-opacity duration-700 ${
                            index === currentSlide
                                ? 'opacity-100 z-10'
                                : 'opacity-0 z-0'
                        }`}
                        aria-hidden={index !== currentSlide}
                    >
                        <Image
                            src={slide.image}
                            alt={slide.alt}
                            fill
                            style={{ objectFit: 'cover' }}
                            priority={index === 0}
                            sizes="100vw"
                        />
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-black/40" />

                        {/* Content */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="container mx-auto px-4">
                                <div className="max-w-3xl mx-auto text-center text-white">
                                    <h2 className="text-3xl md:text-5xl font-bold mb-4">
                                        {slide.title}
                                    </h2>
                                    <p className="text-lg md:text-xl mb-8">
                                        {slide.description}
                                    </p>
                                    <a
                                        href={bookingUrl}
                                        className="inline-block bg-brand-gold text-white px-8 py-3 rounded-md hover:bg-yellow-600 transition focus:outline-none focus:ring-2 focus:ring-brand-gold focus:ring-offset-2"
                                    >
                                        {BUSINESS_INFO.booking.text}
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Navigation Arrows */}
            <button
                type="button"
                onClick={() => {
                    prevSlide();
                    setIsAutoPlaying(false);
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/40 text-white p-3 rounded-full transition focus:outline-none focus:ring-2 focus:ring-brand-gold"
                aria-label="Previous slide"
            >
                <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                    />
                </svg>
            </button>

            <button
                type="button"
                onClick={() => {
                    nextSlide();
                    setIsAutoPlaying(false);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/40 text-white p-3 rounded-full transition focus:outline-none focus:ring-2 focus:ring-brand-gold"
                aria-label="Next slide"
            >
                <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                    />
                </svg>
            </button>

            {/* Dots Navigation */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex space-x-2">
                {data.map((slide, index) => (
                    <button
                        key={slide.id}
                        type="button"
                        onClick={() => goToSlide(index)}
                        className={`w-3 h-3 rounded-full transition focus:outline-none focus:ring-2 focus:ring-brand-gold focus:ring-offset-2 ${
                            index === currentSlide
                                ? 'bg-brand-gold'
                                : 'bg-white/50 hover:bg-white/70'
                        }`}
                        aria-label={`Go to slide ${index + 1}`}
                        aria-current={index === currentSlide}
                    />
                ))}
            </div>
        </section>
    );
}
