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

export async function logClientError(payload: ClientLogPayload) {
    if (!ENABLED) return;
    try {
        await fetch('/api/logs/client', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
