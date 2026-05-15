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
        // Never let Sentry attach the user's IP / cookies / headers on its
        // own. We surface PII deliberately, not by default.
        sendDefaultPii: false,
        beforeSend(event) {
            // Scrub request-level credentials and any header / cookie data
            // that could carry session tokens (cookies, Authorization,
            // X-XSRF-TOKEN, etc.).
            if (event.request) {
                delete event.request.cookies;
                if (event.request.headers) {
                    const headers: Record<string, string> = {};
                    for (const [k, v] of Object.entries(
                        event.request.headers,
                    )) {
                        const lk = k.toLowerCase();
                        if (
                            lk === 'cookie' ||
                            lk === 'authorization' ||
                            lk === 'x-xsrf-token' ||
                            lk === 'set-cookie'
                        ) {
                            headers[k] = '[Filtered]';
                        } else {
                            headers[k] = String(v);
                        }
                    }
                    event.request.headers = headers;
                }
            }
            if (event.user) {
                // Keep id only if we explicitly set it; never accept
                // browser-derived IP from the SDK default.
                delete event.user.ip_address;
            }
            return event;
        },
    });
}
