'use client';
import { useEffect, useRef, useState } from 'react';
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

export default function ImageLightbox(props: Props) {
    const { alt, onClose } = props as BaseProps;
    const hasCarousel = 'sources' in props && Array.isArray(props.sources);
    const currentSrc = hasCarousel
        ? (props as any).sources[(props as any).index]
        : (props as any).src;
    const containerRef = useRef<HTMLDivElement>(null);
    const closeRef = useRef<HTMLButtonElement>(null);
    const [showHint, setShowHint] = useState(false);
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                try { trackEvent('lightbox_close', { src: currentSrc }); } catch {}
                onClose();
            }
            if (hasCarousel) {
                if (e.key === 'ArrowLeft') {
                    try { trackEvent('lightbox_prev', { src: currentSrc, index: (props as any).index }); } catch {}
                    (props as any).onPrev?.();
                }
                if (e.key === 'ArrowRight') {
                    try { trackEvent('lightbox_next', { src: currentSrc, index: (props as any).index }); } catch {}
                    (props as any).onNext?.();
                }
            }
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onClose, hasCarousel, props, currentSrc]);

    useEffect(() => {
        // Show a quick hint on first open (per session)
        try {
            const key = 'lb_hint_shown';
            if (!sessionStorage.getItem(key)) {
                setShowHint(true);
                sessionStorage.setItem(key, '1');
            }
        } catch {}
        // Focus close button on open for accessibility
        try { trackEvent('lightbox_open', { src: currentSrc }); } catch {}
        closeRef.current?.focus();
    }, []);

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
    };

    const onShare = async () => {
        const url = absUrl(currentSrc);
        try {
            // @ts-ignore - web share is optional
            if (navigator.share) {
                // @ts-ignore
                await navigator.share({ url, title: alt || 'Image' });
            } else if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(url);
            }
            try { trackEvent('lightbox_share', { src: currentSrc }); } catch {}
        } catch {
            // ignore failures
        }
    };

    const onDownload = () => {
        try { trackEvent('lightbox_download', { src: currentSrc }); } catch {}
        const a = document.createElement('a');
        a.href = absUrl(currentSrc);
        a.download = '';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const handleClose = () => {
        try { trackEvent('lightbox_close', { src: currentSrc }); } catch {}
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
            <img
                src={currentSrc}
                alt={alt || 'Image preview'}
                className="max-h-[90vh] max-w-[90vw] object-contain"
                onClick={(e) => e.stopPropagation()}
            />
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
                        onClick={(props as any).onPrev}
                    >
                        ‹
                    </button>
                    <button
                        type="button"
                        aria-label="Next image"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white text-2xl"
                        onClick={(props as any).onNext}
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
