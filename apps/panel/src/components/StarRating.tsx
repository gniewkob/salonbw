import { useState } from 'react';

interface StarRatingProps {
    /** Current value 1–5 (0 = none selected). */
    value: number;
    /** When provided, stars are interactive buttons; omit for read-only. */
    onChange?: (value: number) => void;
    /** Compact size for list rows. */
    size?: 'sm' | 'md';
    label?: string;
}

const STAR_FILLED = '★';
const STAR_EMPTY = '☆';

/**
 * Brand B&W star rating. Interactive mode renders 5 accessible buttons
 * (44px touch targets via padding); read-only mode renders plain text with
 * an aria-label describing the score.
 */
export default function StarRating({
    value,
    onChange,
    size = 'md',
    label = 'Ocena wizyty',
}: StarRatingProps) {
    const [hovered, setHovered] = useState(0);

    const fontSize = size === 'sm' ? '1rem' : '1.5rem';

    if (!onChange) {
        return (
            <span
                aria-label={`${label}: ${value} z 5`}
                style={{ fontSize, color: '#0d0d0d', letterSpacing: '2px' }}
            >
                {Array.from({ length: 5 }, (_, i) =>
                    i < value ? STAR_FILLED : STAR_EMPTY,
                ).join('')}
            </span>
        );
    }

    const shown = hovered || value;

    return (
        <div
            role="radiogroup"
            aria-label={label}
            className="d-inline-flex align-items-center"
            onMouseLeave={() => setHovered(0)}
        >
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    role="radio"
                    aria-checked={value === star}
                    aria-label={`${star} ${star === 1 ? 'gwiazdka' : 'gwiazdki'}`}
                    onClick={() => onChange(star)}
                    onMouseEnter={() => setHovered(star)}
                    onFocus={() => setHovered(star)}
                    onBlur={() => setHovered(0)}
                    style={{
                        appearance: 'none',
                        background: 'transparent',
                        border: 0,
                        cursor: 'pointer',
                        fontSize,
                        lineHeight: 1,
                        padding: '10px 4px',
                        color: star <= shown ? '#0d0d0d' : '#b4b8be',
                    }}
                >
                    {star <= shown ? STAR_FILLED : STAR_EMPTY}
                </button>
            ))}
        </div>
    );
}
