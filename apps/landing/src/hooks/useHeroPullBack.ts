import { useEffect, useRef } from 'react';

/**
 * Immersive "pull-back": as the visitor scrolls through the hero, the photo
 * frame recedes (scale + rounded corners) into the black stage. Writes one
 * CSS variable per animation frame; no state, no re-render. Disabled for
 * prefers-reduced-motion. Content is never hidden by this effect.
 */
export function useHeroPullBack<T extends HTMLElement = HTMLElement>() {
    const ref = useRef<T>(null);
    useEffect(() => {
        const hero = ref.current;
        if (!hero) return;
        const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
        let frame = 0;
        const update = () => {
            frame = 0;
            if (motion.matches) {
                hero.style.setProperty('--hero-progress', '0');
                return;
            }
            const height = hero.offsetHeight || 1;
            const progress = Math.min(Math.max(window.scrollY / height, 0), 1);
            hero.style.setProperty('--hero-progress', progress.toFixed(3));
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
