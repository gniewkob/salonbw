import { useEffect, useState } from 'react';

/**
 * Subscribes to `prefers-reduced-motion`. Returns `true` when the user has
 * asked the OS for less motion, so callers can swap CSS transitions /
 * transforms for instant changes.
 *
 * Initial value is `false` on both server and first client render so the
 * markup is consistent during hydration. A post-mount effect flips it if the
 * OS reports otherwise.
 */
export function useReducedMotion(): boolean {
    const [reduced, setReduced] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined' || !window.matchMedia) return;

        const media = window.matchMedia('(prefers-reduced-motion: reduce)');
        setReduced(media.matches);

        const handler = (event: MediaQueryListEvent) => {
            setReduced(event.matches);
        };

        media.addEventListener('change', handler);
        return () => {
            media.removeEventListener('change', handler);
        };
    }, []);

    return reduced;
}
