'use client';
import { useEffect, useRef } from 'react';
import { absUrl } from '@/utils/seo';

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
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (hasCarousel) {
                if (e.key === 'ArrowLeft') (props as any).onPrev?.();
                if (e.key === 'ArrowRight') (props as any).onNext?.();
            }
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onClose, hasCarousel, props]);

    useEffect(() => {
        // Focus close button on open for accessibility
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
        } catch {
            // ignore failures
        }
    };

    return (
        <div
            role="dialog"
            aria-modal
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
            onClick={onClose}
            onKeyDown={onKeyDown}
            ref={containerRef}
        >
            <img
                src={currentSrc}
                alt={alt || 'Image preview'}
                className="max-h-[90vh] max-w-[90vw] object-contain"
                onClick={(e) => e.stopPropagation()}
            />
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
                onClick={onClose}
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
        </div>
    );
}
