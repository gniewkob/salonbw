import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';

type State = 'idle' | 'loading' | 'done';

/**
 * Top-of-page route progress bar. NProgress-style: a translucent silver
 * sweep slides across the top edge while the next chunk loads, then fills
 * solid + fades out on routeChangeComplete. Gives the user a clear
 * "navigating" signal during slow dynamic-import loads (FullCalendar on
 * /calendar especially).
 */
export default function RouteProgress() {
    const router = useRouter();
    const [state, setState] = useState<State>('idle');
    const fadeOutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const clearFadeOut = () => {
            if (fadeOutTimer.current) {
                clearTimeout(fadeOutTimer.current);
                fadeOutTimer.current = null;
            }
        };

        const onStart = () => {
            clearFadeOut();
            setState('loading');
        };
        const onDone = () => {
            setState('done');
            clearFadeOut();
            fadeOutTimer.current = setTimeout(() => {
                setState('idle');
            }, 260);
        };

        router.events.on('routeChangeStart', onStart);
        router.events.on('routeChangeComplete', onDone);
        router.events.on('routeChangeError', onDone);
        return () => {
            clearFadeOut();
            router.events.off('routeChangeStart', onStart);
            router.events.off('routeChangeComplete', onDone);
            router.events.off('routeChangeError', onDone);
        };
    }, [router.events]);

    if (state === 'idle') return null;

    const isDone = state === 'done';

    return (
        <div
            aria-hidden
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                height: 3,
                zIndex: 9999,
                pointerEvents: 'none',
                overflow: 'hidden',
                background: 'transparent',
            }}
        >
            <div
                style={{
                    height: '100%',
                    width: isDone ? '100%' : '70%',
                    background: isDone
                        ? 'var(--salon-accent, #b4b8be)'
                        : 'linear-gradient(90deg, transparent, var(--salon-accent, #b4b8be), transparent)',
                    animation: isDone
                        ? undefined
                        : 'salonbw-route-progress 1.1s ease-in-out infinite',
                    opacity: isDone ? 0 : 1,
                    transition: isDone ? 'opacity 220ms ease-out' : undefined,
                }}
            />
        </div>
    );
}
