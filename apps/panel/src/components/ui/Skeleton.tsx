import type { CSSProperties } from 'react';

interface SkeletonProps {
    width?: number | string;
    height?: number | string;
    radius?: number | string;
    style?: CSSProperties;
    'aria-label'?: string;
}

/**
 * Generic skeleton placeholder. Pair with role='status' on the parent
 * container if it's a screen-reader-visible loading region. The shimmer
 * animation respects prefers-reduced-motion via salon-shell.css safety
 * net (no infinite animation when the user opted out).
 */
export default function Skeleton({
    width = '100%',
    height = '1em',
    radius = 4,
    style,
    ...rest
}: SkeletonProps) {
    return (
        <span
            aria-hidden
            className="salonbw-skeleton"
            style={{
                display: 'inline-block',
                width,
                height,
                borderRadius:
                    typeof radius === 'number' ? `${radius}px` : radius,
                background:
                    'linear-gradient(90deg, #f1f3f5 0%, #e9ecef 50%, #f1f3f5 100%)',
                backgroundSize: '200% 100%',
                animation: 'salonbw-skeleton-shimmer 1.4s ease-in-out infinite',
                ...style,
            }}
            {...rest}
        />
    );
}
