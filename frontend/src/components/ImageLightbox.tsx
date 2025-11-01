'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { absUrl } from '@/utils/seo';
import { trackEvent } from '@/utils/analytics';

interface BaseProps {
    alt?: string;
    onClose: () => void;
}

type Props =
    | (BaseProps & {
          src: string;
          sources?: undefined;
          index?: undefined;
          onPrev?: undefined;
          onNext?: undefined;
      })
    | (BaseProps & {
          src?: undefined;
          sources: string[];
          index: number;
          onPrev: () => void;
          onNext: () => void;
      });

interface CarouselProps extends BaseProps {
    src?: undefined;
    sources: string[];
    index: number;
    onPrev: () => void;
    onNext: () => void;
}

interface SingleProps extends BaseProps {
    src: string;
    sources?: undefined;
    index?: undefined;
    onPrev?: undefined;
    onNext?: undefined;
}

export default function ImageLightbox(props: Props) {
    const { alt, onClose } = props;
    const hasCarousel =
        'sources' in props &&
        Array.isArray(props.sources) &&
        props.sources.length > 0;
    const isCarouselProps = (p: Props): p is CarouselProps =>
        'sources' in p && Array.isArray(p.sources) && p.sources.length > 0;
    const currentSrc = isCarouselProps(props)
        ? props.sources[props.index]
        : (props as SingleProps).src;
    const containerRef = useRef<HTMLDivElement>(null);
    const closeRef = useRef<HTMLButtonElement>(null);
    const [showHint, setShowHint] = useState(false);
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                try {
                    trackEvent('lightbox_close', { src: currentSrc });
                } catch {}
                onClose();
            }
            if (hasCarousel) {
                const carouselProps = props as CarouselProps;
                if (e.key === 'ArrowLeft') {
                    try {
                        trackEvent('lightbox_prev', {
                            src: currentSrc,
                            index: carouselProps.index,
                        });
                    } catch {}
                    carouselProps.onPrev();
                }
                if (e.key === 'ArrowRight') {
                    try {
                        trackEvent('lightbox_next', {
                            src: currentSrc,
                            index: carouselProps.index,
                        });
                    } catch {}
                    carouselProps.onNext();
                }
            }
        };

        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onClose, hasCarousel, props, currentSrc]);

    useEffect(() => {
        // Show a quick hint on first open (per session)
        if (typeof window !== 'undefined') {
            try {
                const key = 'lb_hint_shown';
                if (!sessionStorage.getItem(key)) {
                    setShowHint(true);
                    sessionStorage.setItem(key, '1');
                }
            } catch {}
        }
        // Focus close button on open for accessibility
        try {
            trackEvent('lightbox_open', { src: currentSrc });
        } catch {}
        closeRef.current?.focus();
    }, [currentSrc]);

    const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key !== 'Tab') return;
        const root = containerRef.current;
        if (!root) return;
        const focusables = Array.from(
            root.querySelectorAll<HTMLElement>('button'),
        ).filter((el) => !el.hasAttribute('disabled'));
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (typeof document !== 'undefined') {
            const active = document.activeElement as HTMLElement | null;
            if (e.shiftKey) {
                if (active === first || !root.contains(active)) {
                    e.preventDefault();
                    last.focus();
                }
            } else {
                if (active === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        }
    };

    const onShare = async () => {
        const url = absUrl(currentSrc as string);
        try {
            if (typeof window === 'undefined' || !window.navigator) return;

            const nav: Navigator = window.navigator;

            if ('share' in nav && typeof nav.share === 'function') {
                await nav.share({ url, title: alt || 'Image' });
            } else if ('clipboard' in nav && nav.clipboard?.writeText) {
                await nav.clipboard.writeText(url);
            }

            try {
                trackEvent('lightbox_share', { src: currentSrc });
            } catch {}
        } catch {
            // ignore failures
        }
    };

    const onDownload = () => {
        try {
            trackEvent('lightbox_download', { src: currentSrc });
        } catch {}
        if (typeof window === 'undefined') return;

        const a = document.createElement('a');
        a.href = absUrl(currentSrc as string);
        a.download = '';
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const handleClose = () => {
        try {
            trackEvent('lightbox_close', { src: currentSrc });
        } catch {}
        onClose();
    };

    return (
        <div
            role="dialog"
            aria-modal
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
            onClick={handleClose}
            onKeyDown={onKeyDown}
            ref={containerRef}
        >
            <div
                className="relative w-[90vw] h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                <Image
                    src={currentSrc}
                    alt={alt || 'Image preview'}
                    fill
                    style={{ objectFit: 'contain' }}
                    sizes="90vw"
                />
            </div>
            {showHint && (
                <div
                    className="absolute top-12 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs px-3 py-1 rounded-full"
                    role="status"
                    aria-live="polite"
                    onAnimationEnd={() => setShowHint(false)}
                >
                    Tip: swipe or use arrows; tap ⤴ to share, ⤓ to download
                </div>
            )}
            {hasCarousel && (
                <>
                    <button
                        type="button"
                        aria-label="Previous image"
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-white text-2xl"
                        onClick={(props as CarouselProps).onPrev}
                    >
                        ‹
                    </button>
                    <button
                        type="button"
                        aria-label="Next image"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white text-2xl"
                        onClick={(props as CarouselProps).onNext}
                    >
                        ›
                    </button>
                </>
            )}
            <button
                type="button"
                aria-label="Close"
                className="absolute top-3 right-3 text-white text-2xl"
                onClick={handleClose}
                ref={closeRef}
            >
                ×
            </button>
            <button
                type="button"
                aria-label="Share image"
                title="Share image"
                className="absolute top-3 right-12 text-white text-xl"
                onClick={(e) => {
                    e.stopPropagation();
                    void onShare();
                }}
            >
                ⤴
            </button>
            <button
                type="button"
                aria-label="Download image"
                title="Download image"
                className="absolute top-3 right-24 text-white text-xl"
                onClick={(e) => {
                    e.stopPropagation();
                    onDownload();
                }}
            >
                ⤓
            </button>
        </div>
    );
}
