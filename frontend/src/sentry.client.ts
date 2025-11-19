import * as Sentry from '@sentry/nextjs';

let initialized = false;

export function initSentry() {
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
    const integrations = [];
    if (
        (replaysSessionSampleRate ?? 0) > 0 ||
        (replaysOnErrorSampleRate ?? 0) > 0
    ) {
        integrations.push(Sentry.replayIntegration());
    }
    Sentry.init({
        dsn,
        enabled: process.env.NODE_ENV === 'production',
        tracesSampleRate,
        replaysSessionSampleRate,
        replaysOnErrorSampleRate,
        integrations,
    });
}
