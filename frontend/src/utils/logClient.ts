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

const API_BASE =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? '/api';
const CLIENT_LOG_URL = `${API_BASE}/logs/client`;
const LOG_TOKEN = process.env.NEXT_PUBLIC_LOG_TOKEN;

export async function logClientError(payload: ClientLogPayload) {
    if (!ENABLED) return;
    try {
        await fetch(CLIENT_LOG_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(LOG_TOKEN ? { 'x-log-token': LOG_TOKEN } : {}),
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
