import * as Sentry from '@sentry/nextjs';

let initialized = false;

export function initSentry() {
    if (initialized) return;
    const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
    if (!dsn) return;
    initialized = true;
    Sentry.init({
        dsn,
        enabled: process.env.NODE_ENV === 'production',
        tracesSampleRate: Number(
            process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE || 0,
        ),
    });
}
