type ClientLogPayload = {
    message: string;
    stack?: string | null;
    path?: string;
    level?: 'fatal' | 'error' | 'warn' | 'info';
    extra?: Record<string, unknown>;
};

const ENABLED =
    process.env.NEXT_PUBLIC_ENABLE_CLIENT_LOGS !== 'false' &&
    typeof window !== 'undefined';

// Always go through the same-origin proxy at /api/[...path], NOT directly to
// NEXT_PUBLIC_API_URL. The proxy attaches the x-log-token server-side from
// `CLIENT_LOG_TOKEN` env, so we never ship the token in the JS bundle (it
// used to be exposed as NEXT_PUBLIC_LOG_TOKEN — world-readable to anyone
// inspecting bundle output).
const CLIENT_LOG_URL = '/api/logs/client';

export async function logClientError(payload: ClientLogPayload) {
    if (!ENABLED) return;
    try {
        await fetch(CLIENT_LOG_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...payload,
                userAgent: window.navigator.userAgent,
            }),
            keepalive: true,
            credentials: 'include',
        });
    } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
            // eslint-disable-next-line no-console
            console.warn('Failed to send client log', error);
        }
    }
}
