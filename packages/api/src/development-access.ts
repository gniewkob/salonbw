/** Server/middleware-only development access; credentials are never public env keys. */
export async function developmentAccessAllowed(authorization: string | null, env: Record<string, string | undefined> = process.env): Promise<boolean> {
    if (env.NEXT_PUBLIC_DEPLOYMENT_ENV !== 'development') return true;
    if (!env.DEV_ACCESS_USER || !env.DEV_ACCESS_PASSWORD || !authorization || authorization.length > 2048) return false;
    const expected = 'Basic ' + btoa(env.DEV_ACCESS_USER + ':' + env.DEV_ACCESS_PASSWORD);
    const encoder = new TextEncoder();
    const [actual, wanted] = await Promise.all([authorization, expected].map(value => crypto.subtle.digest('SHA-256', encoder.encode(value))));
    const a = new Uint8Array(actual); const b = new Uint8Array(wanted);
    let difference = 0;
    for (let i = 0; i < a.length; i++) difference |= a[i] ^ b[i];
    return difference === 0;
}

/** Add development access only to server-side requests to the configured API. */
export function developmentApiHeaders(): Record<string, string> {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (typeof window === 'undefined' && process.env.NEXT_PUBLIC_DEPLOYMENT_ENV === 'development') {
        if (!process.env.DEV_ACCESS_USER || !process.env.DEV_ACCESS_PASSWORD) throw new Error('Development API access is not configured');
        headers.Authorization = 'Basic ' + btoa(process.env.DEV_ACCESS_USER + ':' + process.env.DEV_ACCESS_PASSWORD);
    }
    return headers;
}
