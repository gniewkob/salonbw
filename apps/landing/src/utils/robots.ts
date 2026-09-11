/**
 * Indexing rules keyed to the host actually serving the response.
 *
 * The landing is built once and deployed to more than one host: today the
 * public site still runs on the legacy stack and this app is served from
 * `dev.salon-bw.pl`; after the cutover the same build serves
 * `salon-bw.pl` while `dev.` stays as a development environment. Canonical
 * URLs and the sitemap always point at the canonical site, so any host that
 * is NOT the canonical one is a copy that must never be indexed.
 *
 * Deciding by host (instead of by a build-time flag) keeps the rule correct
 * on both sides of the cutover without another deployment change.
 */

export const CANONICAL_SITE_URL_FALLBACK = 'https://salon-bw.pl';

export function resolveSiteUrl(siteUrl?: string | null): string {
    const value = siteUrl ?? process.env.NEXT_PUBLIC_SITE_URL;
    return value && value.trim() ? value.trim() : CANONICAL_SITE_URL_FALLBACK;
}

/** Hostname of the canonical site, lowercased and without a port. */
export function canonicalHost(siteUrl?: string | null): string | null {
    try {
        return new URL(resolveSiteUrl(siteUrl)).hostname.toLowerCase();
    } catch {
        return null;
    }
}

function normalizeHost(host?: string | null): string | null {
    if (!host) return null;
    // `Host` carries an optional port, and IPv6 literals are bracketed.
    const withoutPort = host.trim().replace(/:\d+$/, '');
    return withoutPort ? withoutPort.toLowerCase() : null;
}

/**
 * A missing or unparsable host is treated as non-canonical on purpose: the
 * failure mode of this check should be "not indexed", never "indexed twice".
 */
export function isCanonicalHost(
    host?: string | null,
    siteUrl?: string | null,
): boolean {
    const expected = canonicalHost(siteUrl);
    const actual = normalizeHost(host);
    if (!expected || !actual) return false;
    return actual === expected;
}

export function buildRobotsTxt(options: {
    host?: string | null;
    siteUrl?: string | null;
}): string {
    const { host, siteUrl } = options;
    if (!isCanonicalHost(host, siteUrl)) {
        return ['User-agent: *', 'Disallow: /', ''].join('\n');
    }
    const sitemap = new URL('/sitemap.xml', resolveSiteUrl(siteUrl)).toString();
    return ['User-agent: *', 'Allow: /', '', `Sitemap: ${sitemap}`, ''].join(
        '\n',
    );
}
