'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { PauseIcon, PlayIcon } from '@heroicons/react/20/solid';
import { HERO_SLIDES, BUSINESS_INFO } from '@/config/content';
import { getPanelUrl } from '@/utils/panelUrl';
import { useLanguage } from '@/contexts/LanguageContext';

type HeroSlide = {
    id: number;
    title: string;
    description: string;
    image: string;
    alt: string;
};

interface HeroSliderProps {
    slides?: HeroSlide[];
}

export default function HeroSlider({ slides }: HeroSliderProps) {
    const { T } = useLanguage();
    const data = slides ?? (HERO_SLIDES as unknown as HeroSlide[]);
    const sectionRef = useRef<HTMLElement>(null);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [userPaused, setUserPaused] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

    const bookingUrl = getPanelUrl(
        `/auth/login?redirect=${encodeURIComponent('/appointments')}`,
    );

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        const update = () => setPrefersReducedMotion(mq.matches);
        update();
        mq.addEventListener('change', update);
        return () => mq.removeEventListener('change', update);
    }, []);

    const isPlaying = !userPaused && !isHovered && !prefersReducedMotion;

    const nextSlide = useCallback(() => {
        setCurrentSlide((prev) => (prev + 1) % data.length);
    }, [data.length]);

    const prevSlide = useCallback(() => {
        setCurrentSlide((prev) => (prev - 1 + data.length) % data.length);
    }, [data.length]);

    const goToSlide = useCallback((index: number) => {
        setCurrentSlide(index);
    }, []);

    useEffect(() => {
        if (!isPlaying) return;
        const interval = setInterval(nextSlide, 5500);
        return () => clearInterval(interval);
    }, [isPlaying, nextSlide]);

    useEffect(() => {
        const section = sectionRef.current;
        if (!section) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as Element | null;
            const tag = target?.tagName;
            if (
                tag === 'INPUT' ||
                tag === 'TEXTAREA' ||
                tag === 'SELECT' ||
                (target as HTMLElement | null)?.isContentEditable
            ) {
                return;
            }
            if (e.key === 'ArrowLeft') prevSlide();
            else if (e.key === 'ArrowRight') nextSlide();
        };
        section.addEventListener('keydown', handleKeyDown);
        return () => section.removeEventListener('keydown', handleKeyDown);
    }, [nextSlide, prevSlide]);

    return (
        <section
            ref={sectionRef}
            className="relative min-h-[600px] overflow-hidden"
            style={{ height: '100svh' }}
            aria-label="Slider główny"
            aria-roledescription="carousel"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onFocus={() => setIsHovered(true)}
            onBlur={(e) => {
                if (!sectionRef.current?.contains(e.relatedTarget as Node)) {
                    setIsHovered(false);
                }
            }}
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
                            style={{
                                objectFit: 'cover',
                                objectPosition: 'center 30%',
                            }}
                            priority={index === 0}
                            sizes="100vw"
                        />
                        <div
                            className="absolute inset-0"
                            style={{
                                background:
                                    'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0.72) 100%)',
                            }}
                        />
                    </div>
                ))}
            </div>

            {/* Content — centred vertically */}
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center px-4">
                <div className="max-w-3xl mx-auto text-center text-white">
                    {/* Academy eyebrow */}
                    <p
                        className="hero-tag mb-3 uppercase text-xs md:text-sm"
                        style={{
                            color: 'var(--brand-silver)',
                            fontFamily: "'Open Sans', sans-serif",
                            letterSpacing: '0.25em',
                        }}
                    >
                        Akademia Zdrowych Włosów
                    </p>

                    {/* Main heading */}
                    <h1
                        className="hero-title text-4xl md:text-6xl font-bold leading-tight mb-2"
                        style={{
                            fontFamily: "'Playfair Display', serif",
                            textShadow: '0 2px 12px rgba(0,0,0,0.4)',
                        }}
                    >
                        {data[currentSlide]?.title ?? BUSINESS_INFO.name}
                    </h1>

                    {/* Tangerine script accent */}
                    <p
                        className="hero-tag mb-6"
                        style={{
                            fontFamily: "'Tangerine', cursive",
                            fontSize: 'clamp(2rem, 5vw, 3.2rem)',
                            color: 'var(--brand-silver)',
                            lineHeight: 1.2,
                        }}
                    >
                        Black &amp; White
                    </p>

                    <p
                        className="hero-desc text-base md:text-lg mb-10 max-w-xl mx-auto"
                        style={{ opacity: 0.9 }}
                    >
                        {data[currentSlide]?.description ?? ''}
                    </p>

                    <div className="hero-cta flex flex-col sm:flex-row gap-4 justify-center">
                        <a
                            href={bookingUrl}
                            className="btn-silver inline-block px-10 py-4 text-sm font-semibold uppercase focus:outline-none focus:ring-2 focus:ring-offset-2"
                            style={{
                                letterSpacing: '0.12em',
                                borderRadius: '2px',
                                boxShadow: '0 4px 24px rgba(180,184,190,0.4)',
                            }}
                        >
                            {T.nav.booking}
                        </a>
                        <Link
                            href="/services"
                            className="btn-outline-white inline-block px-10 py-4 text-sm font-semibold uppercase focus:outline-none focus:ring-2 focus:ring-offset-2"
                            style={{
                                letterSpacing: '0.12em',
                                borderRadius: '2px',
                            }}
                        >
                            Nasze usługi
                        </Link>
                    </div>
                </div>
            </div>

            {/* Navigation Arrows */}
            <button
                type="button"
                onClick={() => prevSlide()}
                className="btn-glass absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2"
                aria-label="Poprzedni slajd"
            >
                <svg
                    className="w-5 h-5 text-white"
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
                onClick={() => nextSlide()}
                className="btn-glass absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2"
                aria-label="Następny slajd"
            >
                <svg
                    className="w-5 h-5 text-white"
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

            {/* Dots + pause toggle */}
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 flex items-center space-x-3">
                <div className="flex space-x-2">
                    {data.map((slide, index) => (
                        <button
                            key={slide.id}
                            type="button"
                            onClick={() => goToSlide(index)}
                            className="focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#b4b8be]"
                            style={{
                                // 24px min touch target; visual dot is the inner span
                                padding: '8px',
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                            }}
                            aria-label={`Slajd ${index + 1} z ${data.length}`}
                            aria-current={index === currentSlide}
                        >
                            <span
                                aria-hidden
                                className="block transition-all duration-300"
                                style={{
                                    width:
                                        index === currentSlide
                                            ? '28px'
                                            : '8px',
                                    height: '8px',
                                    borderRadius: '4px',
                                    background:
                                        index === currentSlide
                                            ? 'var(--brand-silver)'
                                            : 'rgba(255,255,255,0.45)',
                                }}
                            />
                        </button>
                    ))}
                </div>
                <button
                    type="button"
                    onClick={() => setUserPaused((p) => !p)}
                    className="text-white/80 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#b4b8be] rounded-full p-1.5"
                    aria-label={
                        userPaused ? 'Wznów slider' : 'Wstrzymaj slider'
                    }
                    aria-pressed={userPaused}
                    title={userPaused ? 'Wznów slider' : 'Wstrzymaj slider'}
                >
                    {userPaused ? (
                        <PlayIcon style={{ width: 14, height: 14 }} />
                    ) : (
                        <PauseIcon style={{ width: 14, height: 14 }} />
                    )}
                </button>
            </div>

            {/* Scroll indicator */}
            <div className="hero-scroll absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2">
                <span
                    className="text-white/60 uppercase"
                    style={{ fontSize: '10px', letterSpacing: '0.2em' }}
                >
                    {T.hero.scroll}
                </span>
                <svg
                    className="scroll-arrow w-5 h-5 text-white/50"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M19 9l-7 7-7-7"
                    />
                </svg>
            </div>
        </section>
    );
}
