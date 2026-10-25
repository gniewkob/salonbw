const RAW_API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.API_BASE_URL ||
    'https://api.salon-bw.pl';

function isAbsoluteUrl(value: string): boolean {
    return /^https?:\/\//i.test(value);
}

/**
 * Resolve the API base URL for a fetch.
 *
 * In the browser a relative base such as "/api" is valid (it resolves against
 * the current origin and is proxied to the backend by the Next.js rewrite).
 * On the server — including build-time static generation (SSG/ISR) — Node's
 * `fetch` cannot parse a relative URL, so we must turn it into an absolute one.
 *
 * The rewrite maps `/api/:path*` → `${API_PROXY_URL}/:path*` (it strips the
 * leading `/api` segment), so server-side we mirror that: replace the relative
 * base with the proxy target origin.
 *
 * Exported (and parameterised) so the server-side branch is unit-testable
 * without having to remove `window` from the jsdom test environment.
 */
export function resolveApiBaseUrl(
    base: string = RAW_API_BASE_URL,
    isServer: boolean = typeof window === 'undefined',
): string {
    if (process.env.NEXT_PUBLIC_DEPLOYMENT_ENV === 'development') {
        const allowed = (value: string) => {
            try {
                return [
                    'dev-api.salon-bw.pl',
                    'localhost',
                    '127.0.0.1',
                    '[::1]',
                ].includes(new URL(value).hostname);
            } catch {
                return false;
            }
        };
        if (isAbsoluteUrl(base) && !allowed(base))
            throw new Error('Development cannot use the production API');
        if (
            isServer &&
            !allowed(
                process.env.API_PROXY_URL || process.env.API_BASE_URL || '',
            )
        )
            throw new Error('Explicit development API origin required');
    }
    if (isAbsoluteUrl(base)) {
        return base;
    }
    // Relative base (e.g. "/api"): usable as-is only in the browser.
    if (!isServer) {
        return base;
    }
    // Server-side: build an absolute origin equivalent to the Next.js rewrite.
    const target = (
        process.env.API_PROXY_URL ||
        process.env.API_BASE_URL ||
        'https://api.salon-bw.pl'
    ).replace(/\/$/, '');
    const origin = isAbsoluteUrl(target) ? target : 'https://api.salon-bw.pl';
    // The rewrite strips a leading "/api" segment; anything else is preserved.
    const remainder = base.replace(/^\/api(?=\/|$)/, '');
    return `${origin}${remainder}`;
}
