/**
 * Temporary anonymous preview of public SalonBW Landing pages on DEV only.
 *
 * Authorized design review window: 2026-11-02 until 23:00 Europe/Warsaw.
 * The exception expires on every request without a restart or scheduled job.
 * Backend API, panel, booking writes, and private routes remain authenticated.
 * Delete this module and the middleware hook after the review.
 */
export const LANDING_PREVIEW_EXPIRES_AT = Date.parse('2026-11-02T23:00:00+01:00');

interface PreviewRequest {
    host: string | null;
    appEnvironment?: string;
    deploymentEnvironment?: string;
    method: string;
    pathname: string;
    now?: number;
}

const PUBLIC_PATHS = new Set([
    '/',
    '/design-lab',
    '/services',
    '/services/balayage',
    '/services/coloring',
    '/services/highlights',
    '/gallery',
    '/contact',
    '/privacy',
    '/policy',
    '/data-deletion',
    '/robots.txt',
    '/sitemap.xml',
]);

const PUBLIC_ASSET_PREFIXES = ['/images/', '/assets/', '/fonts/'];

const DATA_ROUTE = /^\/_next\/data\/[^/]+\/(?:index|design-lab|services|gallery|contact|privacy|policy|data-deletion|services\/(?:balayage|coloring|highlights))\.json$/;

export function isTemporaryLandingPreviewAllowed({
    host,
    appEnvironment,
    deploymentEnvironment,
    method,
    pathname,
    now = Date.now(),
}: PreviewRequest): boolean {
    const hostname = (host ?? '').trim().toLowerCase().split(':')[0];

    if (
        hostname !== 'dev.salon-bw.pl' ||
        appEnvironment !== 'development' ||
        deploymentEnvironment !== 'development' ||
        (method !== 'GET' && method !== 'HEAD') ||
        !Number.isFinite(now) ||
        now >= LANDING_PREVIEW_EXPIRES_AT
    ) {
        return false;
    }

    // Only explicitly public presentation routes and their static assets.
    // In particular, NEVER allow /api, /auth, /dashboard or /__release.json.
    return PUBLIC_PATHS.has(pathname) ||
        PUBLIC_ASSET_PREFIXES.some((prefix) => pathname.startsWith(prefix)) ||
        DATA_ROUTE.test(pathname);
}
