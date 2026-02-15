'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
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
    const isCarouselProps = (p: Props): p is CarouselProps =>
        'sources' in p && Array.isArray(p.sources) && p.sources.length > 0;
    const carouselProps = isCarouselProps(props) ? props : null;
    const hasCarousel = !!carouselProps;
    const currentSrc = carouselProps
        ? carouselProps.sources[carouselProps.index]
        : (props as SingleProps).src;
    const containerRef = useRef<HTMLDivElement>(null);
    const closeRef = useRef<HTMLButtonElement>(null);
    const [showHint, setShowHint] = useState(false);

    const handleClose = useCallback(() => {
        safeTrack('lightbox_close', { src: currentSrc });
        onClose();
    }, [currentSrc, onClose]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const onKey = createKeyHandler(
            handleClose,
            hasCarousel ? carouselProps : null,
            currentSrc,
        );

        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [handleClose, hasCarousel, carouselProps, currentSrc]);

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
        safeTrack('lightbox_open', { src: currentSrc });
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
        await shareImage(url, alt);
        safeTrack('lightbox_share', { src: currentSrc });
    };

    const onDownload = () => {
        safeTrack('lightbox_download', { src: currentSrc });
        downloadImage(currentSrc as string);
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
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-white text-2xl p-2 rounded-full hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-brand-gold"
                        onClick={(props as CarouselProps).onPrev}
                    >
                        ‹
                    </button>
                    <button
                        type="button"
                        aria-label="Next image"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white text-2xl p-2 rounded-full hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-brand-gold"
                        onClick={(props as CarouselProps).onNext}
                    >
                        ›
                    </button>
                </>
            )}
            <button
                type="button"
                aria-label="Close"
                className="absolute top-3 right-3 text-white text-2xl p-2 rounded-full hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-brand-gold"
                onClick={handleClose}
                ref={closeRef}
            >
                ×
            </button>
            <button
                type="button"
                aria-label="Share image"
                title="Share image"
                className="absolute top-3 right-12 text-white text-xl p-2 rounded-full hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-brand-gold"
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
                className="absolute top-3 right-24 text-white text-xl p-2 rounded-full hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-brand-gold"
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

function safeTrack(event: string, payload: Record<string, unknown>) {
    try {
        trackEvent(event, payload);
    } catch {
        // swallow analytics errors
    }
}

function createKeyHandler(
    onClose: () => void,
    carouselProps: CarouselProps | null,
    currentSrc: string,
) {
    return (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
            return;
        }
        if (!carouselProps) return;

        if (e.key === 'ArrowLeft') {
            safeTrack('lightbox_prev', {
                src: currentSrc,
                index: carouselProps.index,
            });
            carouselProps.onPrev();
        } else if (e.key === 'ArrowRight') {
            safeTrack('lightbox_next', {
                src: currentSrc,
                index: carouselProps.index,
            });
            carouselProps.onNext();
        }
    };
}

async function shareImage(url: string, alt?: string) {
    if (typeof window === 'undefined' || !window.navigator) return;

    const nav: Navigator = window.navigator;
    if (typeof nav.share === 'function') {
        await nav.share({ url, title: alt || 'Image' });
        return;
    }
    if (nav.clipboard?.writeText) {
        await nav.clipboard.writeText(url);
    }
}

function downloadImage(src: string) {
    if (typeof window === 'undefined') return;
    const a = document.createElement('a');
    a.href = absUrl(src);
    a.download = '';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}
