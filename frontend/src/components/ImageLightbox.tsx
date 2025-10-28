'use client';
import { useEffect } from 'react';

interface Props {
    src: string;
    alt?: string;
    onClose: () => void;
}

export default function ImageLightbox({ src, alt, onClose }: Props) {
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onClose]);

    return (
        <div
            role="dialog"
            aria-modal
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
            onClick={onClose}
        >
            <img
                src={src}
                alt={alt || 'Image preview'}
                className="max-h-[90vh] max-w-[90vw] object-contain"
                onClick={(e) => e.stopPropagation()}
            />
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

