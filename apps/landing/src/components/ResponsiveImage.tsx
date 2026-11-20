import type { CSSProperties } from 'react';
import manifest from '@/generated/imageManifest.json';

type Entry = { width: number; height: number; widths: number[] };
const MANIFEST = manifest as Record<string, Entry>;

/** WebP srcset for a source listed in scripts/optimize-images.mjs. */
export function webpSrcSet(src: string): string | undefined {
    const entry = MANIFEST[src];
    if (!entry) return undefined;
    const base = src
        .replace(/^\/images\//, '/images/_opt/')
        .replace(/\.jpe?g$/i, '');
    return entry.widths.map((w) => `${base}-${w}.webp ${w}w`).join(', ');
}

interface ResponsiveImageProps {
    src: string;
    alt: string;
    /** `sizes` attribute: how wide the image is shown, per viewport. */
    sizes: string;
    /** Portrait crop for phones (≤768px), also in the manifest. */
    mobileSrc?: string;
    className?: string;
    style?: CSSProperties;
    /** Above-the-fold image: fetched first, not lazy. */
    priority?: boolean;
}

/**
 * <picture> with build-time WebP renditions at several widths and the
 * original JPEG as fallback (images are served unoptimised on MyDevil, so
 * this replaces next/image's resizing). Unknown sources fall back to a plain
 * <img> with the JPEG.
 */
export default function ResponsiveImage({
    src,
    alt,
    sizes,
    mobileSrc,
    className,
    style,
    priority,
}: ResponsiveImageProps) {
    const webp = webpSrcSet(src);
    const mobileWebp = mobileSrc ? webpSrcSet(mobileSrc) : undefined;
    return (
        <picture>
            {mobileSrc && mobileWebp && (
                <source
                    media="(max-width: 768px)"
                    type="image/webp"
                    srcSet={mobileWebp}
                    sizes="100vw"
                />
            )}
            {mobileSrc && (
                <source media="(max-width: 768px)" srcSet={mobileSrc} />
            )}
            {webp && <source type="image/webp" srcSet={webp} sizes={sizes} />}
            {/* eslint-disable-next-line @next/next/no-img-element -- art-directed <picture> with build-time renditions */}
            <img
                src={src}
                alt={alt}
                className={className}
                style={style}
                width={MANIFEST[src]?.width}
                height={MANIFEST[src]?.height}
                loading={priority ? 'eager' : 'lazy'}
                fetchPriority={priority ? 'high' : undefined}
                decoding={priority ? undefined : 'async'}
            />
        </picture>
    );
}
