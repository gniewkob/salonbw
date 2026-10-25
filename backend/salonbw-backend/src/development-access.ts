import { createHash, timingSafeEqual } from 'crypto';

export function developmentAccessAllowed(
    authorization: string | undefined,
    env: NodeJS.ProcessEnv = process.env,
): boolean {
    if (env.APP_ENV !== 'development') return true;
    if (
        !env.DEV_ACCESS_USER ||
        !env.DEV_ACCESS_PASSWORD ||
        !authorization ||
        authorization.length > 2048
    )
        return false;
    const expected =
        'Basic ' +
        Buffer.from(
            env.DEV_ACCESS_USER + ':' + env.DEV_ACCESS_PASSWORD,
        ).toString('base64');
    return timingSafeEqual(
        createHash('sha256').update(authorization).digest(),
        createHash('sha256').update(expected).digest(),
    );
}
