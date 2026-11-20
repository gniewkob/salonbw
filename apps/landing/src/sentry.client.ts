/**
 * Sentry for the landing, loaded lazily.
 *
 * `@sentry/nextjs` used to be imported at the top of _app, which put roughly
 * 130 KB (gzip) of SDK into every page's critical JavaScript — even when no
 * DSN is configured, i.e. when Sentry never runs. Now the SDK is fetched only
 * when a DSN exists, after the page is idle. Trade-off: errors in the first
 * moments before it loads are not reported.
 */
type SentryModule = typeof import('@sentry/nextjs');

let initialized = false;
let sentry: SentryModule | null = null;

/** The loaded SDK, or null before it has loaded / when Sentry is off. */
export function getSentry(): SentryModule | null {
    return sentry;
}

export function initSentry() {
    if (typeof window === 'undefined') return;
    if (initialized) return;
    const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
    if (!dsn) return;
    initialized = true;
    const tracesSampleRate = Number(
        process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? 0.1,
    );
    const replaysSessionSampleRate = Number(
        process.env.NEXT_PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE ?? 0,
    );
    const replaysOnErrorSampleRate = Number(
        process.env.NEXT_PUBLIC_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE ?? 1,
    );
    const load = () => {
        void import('@sentry/nextjs')
            .then((Sentry) => {
                const integrations =
                    replaysSessionSampleRate > 0 || replaysOnErrorSampleRate > 0
                        ? [Sentry.replayIntegration()]
                        : [];
                Sentry.init({
                    dsn,
                    enabled: process.env.NODE_ENV === 'production',
                    tracesSampleRate,
                    replaysSessionSampleRate,
                    replaysOnErrorSampleRate,
                    integrations,
                });
                sentry = Sentry;
            })
            .catch(() => undefined);
    };
    const idle = (
        window as Window & {
            requestIdleCallback?: (
                cb: () => void,
                opts?: { timeout: number },
            ) => number;
        }
    ).requestIdleCallback;
    if (idle) idle(load, { timeout: 4000 });
    else window.setTimeout(load, 2000);
}
