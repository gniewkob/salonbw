import { useEffect } from 'react';
import type { Router } from 'next/router';

/**
 * Smooth page-to-page transitions with the View Transitions API.
 *
 * The old page is captured at `beforeHistoryChange` — after the next page's
 * data has loaded, just before React renders it — so the screen never freezes
 * on a stale snapshot while data is fetched. The transition completes when
 * the new route has rendered. Browsers without the API, and visitors who
 * prefer reduced motion, get the normal instant swap.
 */
export function usePageTransitions(events: Router['events']) {
    useEffect(() => {
        if (typeof document === 'undefined') return;
        const doc = document as Document & {
            startViewTransition?: (cb: () => Promise<void>) => unknown;
        };
        if (typeof doc.startViewTransition !== 'function') return;
        const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
        let finish: (() => void) | null = null;

        const start = (_url: string, { shallow }: { shallow: boolean }) => {
            if (shallow || motion.matches || finish) return;
            const rendered = new Promise<void>((resolve) => {
                finish = resolve;
            });
            // Safety net: never hold the old snapshot for long.
            const timer = window.setTimeout(() => done(), 1500);
            void rendered.then(() => window.clearTimeout(timer));
            doc.startViewTransition?.(() => rendered);
        };
        const done = () => {
            finish?.();
            finish = null;
        };

        events.on('beforeHistoryChange', start);
        events.on('routeChangeComplete', done);
        events.on('routeChangeError', done);
        return () => {
            events.off('beforeHistoryChange', start);
            events.off('routeChangeComplete', done);
            events.off('routeChangeError', done);
            done();
        };
    }, [events]);
}
