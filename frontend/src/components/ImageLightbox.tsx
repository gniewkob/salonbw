'use client';
import { useEffect } from 'react';

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

    return (
        <div
            role="dialog"
            aria-modal
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
            onClick={onClose}
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
            >
                ×
            </button>
        </div>
    );
}
