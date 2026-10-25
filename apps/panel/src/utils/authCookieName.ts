/** Match the backend cookie namespace without sharing session state across environments. */
export function authCookieName(base: string): string {
    const prefix = process.env.NEXT_PUBLIC_AUTH_COOKIE_PREFIX ?? '';
    if (prefix && !/^[a-zA-Z][a-zA-Z0-9_]{0,31}$/.test(prefix))
        throw new Error('Invalid auth cookie prefix');
    if (process.env.NEXT_PUBLIC_DEPLOYMENT_ENV === 'development' && !prefix)
        throw new Error('Development cookie prefix is required');
    return prefix + base;
}
