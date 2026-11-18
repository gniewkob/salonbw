import { useEffect, useRef } from 'react';

/**
 * Pinned "pull-back" for the Cinematic hero.
 *
 * Put the returned ref on a *stage* wrapper whose first child is the hero.
 * The stage is taller than the hero (CSS), the hero is `position: sticky`, so
 * the hero holds still for a short stretch of scroll while the photo frame
 * recedes into the black stage (frame shrinks, corners round, the photo zooms
 * out). Progress 0→1 across that stretch is written to `--hero-progress` on
 * the stage — one CSS variable per animation frame, no React state.
 *
 * Without the pin the frame scrolled away at the same speed it shrank, so the
 * effect was barely visible (reported on iPhone).
 *
 * The nav height is written to `--hero-top` so the pinned hero sits under the
 * sticky navigation instead of behind it. prefers-reduced-motion: progress
 * stays 0 and CSS removes the extra scroll distance.
 */
export function useHeroPullBack<T extends HTMLElement = HTMLElement>() {
    const ref = useRef<T>(null);
    useEffect(() => {
        const stage = ref.current;
        if (!stage) return;
        const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
        let frame = 0;
        const update = () => {
            frame = 0;
            const nav = document.querySelector<HTMLElement>(
                'nav[aria-label="Nawigacja główna"]',
            );
            const top = nav
                ? Math.round(nav.getBoundingClientRect().height)
                : 0;
            stage.style.setProperty('--hero-top', `${top}px`);
            if (motion.matches) {
                stage.style.setProperty('--hero-progress', '0');
                return;
            }
            const hero = stage.firstElementChild as HTMLElement | null;
            const distance =
                stage.offsetHeight - (hero?.offsetHeight ?? stage.offsetHeight);
            const rect = stage.getBoundingClientRect();
            // With no pin distance (e.g. reduced motion CSS), fall back to the
            // hero scrolling away.
            const span = distance > 8 ? distance : stage.offsetHeight || 1;
            const progress = Math.min(Math.max((top - rect.top) / span, 0), 1);
            stage.style.setProperty('--hero-progress', progress.toFixed(3));
        };
        const schedule = () => {
            if (!frame) frame = window.requestAnimationFrame(update);
        };
        update();
        window.addEventListener('scroll', schedule, { passive: true });
        window.addEventListener('resize', schedule);
        motion.addEventListener?.('change', schedule);
        return () => {
            if (frame) window.cancelAnimationFrame(frame);
            window.removeEventListener('scroll', schedule);
            window.removeEventListener('resize', schedule);
            motion.removeEventListener?.('change', schedule);
        };
    }, []);
    return ref;
}
