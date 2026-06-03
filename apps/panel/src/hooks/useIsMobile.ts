import { useEffect, useState } from 'react';

/**
 * Tracks whether the viewport is mobile-sized (≤ 767px). Breakpoint matches
 * Bootstrap 5's `md` boundary so it lines up with `d-md-*` utility classes.
 *
 * On the server the hook returns `false` (desktop assumption) — that's the
 * same initial value the client uses for first render, so there is no
 * hydration mismatch. The real value is applied in a post-mount effect.
 */
export function useIsMobile(query = '(max-width: 767px)'): boolean {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined' || !window.matchMedia) return;

        const media = window.matchMedia(query);
        setIsMobile(media.matches);

        const handler = (event: MediaQueryListEvent) => {
            setIsMobile(event.matches);
        };

        media.addEventListener('change', handler);
        return () => {
            media.removeEventListener('change', handler);
        };
    }, [query]);

    return isMobile;
}
