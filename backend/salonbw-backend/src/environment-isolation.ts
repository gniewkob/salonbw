/** Environment boundaries shared by auth, delivery and startup. */
export function authCookieName(
    base: string,
    prefix = process.env.AUTH_COOKIE_PREFIX ?? '',
): string {
    if (prefix && !/^[a-zA-Z][a-zA-Z0-9_]{0,31}$/.test(prefix)) {
        throw new Error('Invalid auth cookie prefix');
    }
    return prefix + base;
}

export function outboundDeliveryEnabled(
    env: NodeJS.ProcessEnv = process.env,
): boolean {
    return (
        env.APP_ENV !== 'development' &&
        env.OUTBOUND_DELIVERY_ENABLED !== 'false'
    );
}

export function assertDevelopmentEnvironment(
    env: NodeJS.ProcessEnv = process.env,
): void {
    if (env.APP_ENV !== 'development') return;
    const database = new URL(env.DATABASE_URL ?? '');
    if (
        !env.DEV_DATABASE_NAME ||
        decodeURIComponent(database.pathname.slice(1)) !==
            env.DEV_DATABASE_NAME ||
        !env.AUTH_COOKIE_PREFIX ||
        env.OUTBOUND_DELIVERY_ENABLED !== 'false'
    ) {
        throw new Error(
            'Development requires an explicit isolated database, cookie namespace and disabled outbound delivery',
        );
    }
    authCookieName('accessToken', env.AUTH_COOKIE_PREFIX);
    if (
        !env.DEV_ACCESS_USER ||
        !env.DEV_ACCESS_PASSWORD ||
        !env.JWT_SECRET ||
        !env.JWT_REFRESH_SECRET ||
        env.JWT_SECRET === env.JWT_REFRESH_SECRET
    ) {
        throw new Error(
            'Development requires dedicated access and signing secrets',
        );
    }
}
