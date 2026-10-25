/**
 * Redirects needed when this landing replaces the legacy PHP site on
 * `salon-bw.pl` (see docs/DOMAIN_CUTOVER_PLAN.md).
 *
 * - `www.salon-bw.pl` is the legacy canonical host; the landing is canonical
 *   on the bare domain, so `www.` is sent there permanently.
 * - The legacy site's 54 indexed URLs get a permanent redirect to the closest
 *   page here instead of a 404, so search rankings carry over.
 *
 * The map is owner-reviewable: services no longer offered on the new site
 * (beauty treatments, nails, solarium, gift card) point at `/services` until
 * the owner decides between keeping a redirect and returning 410.
 */

export const WWW_HOST = 'www.salon-bw.pl';

/** Exact legacy paths (lowercase, no trailing slash). */
const LEGACY_EXACT: Record<string, string> = {
    '/start': '/',
    '/o-nas': '/#about',
    '/kontakt': '/contact',
    '/modals/adres': '/contact',
    '/modals/godziny': '/contact',
    '/uslugi-fryzjerskie': '/services',
    '/uslugi-fryzjerskie/baleyage': '/services/balayage',
    '/uslugi-fryzjerskie/koloryzacja': '/services/coloring',
    '/uslugi-fryzjerskie/dekoloryzacja': '/services/coloring',
    '/cennik-fryzjerstwo-damskie': '/services',
    '/cennik-fryzjerstwo-meskie': '/services',
    '/uslugi-kosmetyczne': '/services',
    '/cennik-kosmetyka': '/services',
    '/stylizacja-paznokci': '/services',
    '/cennik-stylizacja-paznokci': '/services',
    '/rytualy-kerastase': '/services',
    '/kosmetyki-revitalash': '/services',
    '/pakiety-slubne': '/services',
    '/solarium': '/services',
    '/karta-podarunkowa': '/services',
    '/news': '/',
};

/** Legacy path prefixes for whole sections (checked after exact matches). */
const LEGACY_PREFIXES: Array<[string, string]> = [
    ['/uslugi-fryzjerskie/', '/services'],
    ['/uslugi-kosmetyczne/', '/services'],
    ['/posts/', '/'],
];

/** Legacy booking modal → online booking in the panel. */
const LEGACY_BOOKING_PATH = '/modals/rezerwacja';
const PANEL_BOOKING_PATH = '/booking';

function normalizePath(pathname: string): string {
    const lower = pathname.toLowerCase();
    return lower.length > 1 && lower.endsWith('/') ? lower.slice(0, -1) : lower;
}

/**
 * Target for a legacy URL, or null when the path is not a legacy one.
 * Relative targets stay on the current host; the booking target is absolute
 * (panel).
 */
export function resolveLegacyRedirect(
    pathname: string,
    panelUrl = 'https://panel.salon-bw.pl',
): string | null {
    const path = normalizePath(pathname);
    if (path === LEGACY_BOOKING_PATH) {
        return new URL(PANEL_BOOKING_PATH, panelUrl).toString();
    }
    if (path in LEGACY_EXACT) {
        return LEGACY_EXACT[path];
    }
    for (const [prefix, target] of LEGACY_PREFIXES) {
        if (path.startsWith(prefix)) {
            return target;
        }
    }
    return null;
}

/** True when the request came in on the legacy `www.` host. */
export function isWwwHost(hostHeader: string | null | undefined): boolean {
    if (!hostHeader) return false;
    return hostHeader.toLowerCase().split(':')[0] === WWW_HOST;
}
