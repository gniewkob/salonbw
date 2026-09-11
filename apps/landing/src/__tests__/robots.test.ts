import {
    CANONICAL_SITE_URL_FALLBACK,
    buildRobotsTxt,
    canonicalHost,
    isCanonicalHost,
} from '@/utils/robots';

const CANONICAL = 'https://salon-bw.pl';

describe('canonical host detection', () => {
    it('falls back to the canonical production site when the env var is unset', () => {
        expect(canonicalHost(undefined)).toBe('salon-bw.pl');
        expect(CANONICAL_SITE_URL_FALLBACK).toBe(CANONICAL);
    });

    it('matches the canonical host regardless of case or port', () => {
        expect(isCanonicalHost('salon-bw.pl', CANONICAL)).toBe(true);
        expect(isCanonicalHost('SALON-BW.PL', CANONICAL)).toBe(true);
        expect(isCanonicalHost('salon-bw.pl:443', CANONICAL)).toBe(true);
    });

    it('treats every other host as a copy', () => {
        expect(isCanonicalHost('dev.salon-bw.pl', CANONICAL)).toBe(false);
        expect(isCanonicalHost('www.salon-bw.pl', CANONICAL)).toBe(false);
        expect(isCanonicalHost('localhost:3000', CANONICAL)).toBe(false);
    });

    it('fails closed when the host header is missing or unusable', () => {
        expect(isCanonicalHost(undefined, CANONICAL)).toBe(false);
        expect(isCanonicalHost('', CANONICAL)).toBe(false);
        expect(isCanonicalHost('salon-bw.pl', 'not a url')).toBe(false);
    });
});

describe('robots.txt body', () => {
    it('allows crawling and advertises the sitemap on the canonical host', () => {
        const body = buildRobotsTxt({
            host: 'salon-bw.pl',
            siteUrl: CANONICAL,
        });
        expect(body).toContain('Allow: /');
        expect(body).toContain('Sitemap: https://salon-bw.pl/sitemap.xml');
        expect(body).not.toContain('Disallow');
    });

    it('disallows everything on the dev host serving the same build', () => {
        const body = buildRobotsTxt({
            host: 'dev.salon-bw.pl',
            siteUrl: CANONICAL,
        });
        expect(body).toContain('Disallow: /');
        expect(body).not.toContain('Allow: /');
        // A copy must not advertise the canonical sitemap as its own.
        expect(body).not.toContain('Sitemap:');
    });

    it('disallows when the host header is absent', () => {
        expect(buildRobotsTxt({ host: undefined })).toContain('Disallow: /');
    });

    it('follows the configured site url when it is not the default', () => {
        const body = buildRobotsTxt({
            host: 'example.test',
            siteUrl: 'https://example.test',
        });
        expect(body).toContain('Allow: /');
        expect(body).toContain('Sitemap: https://example.test/sitemap.xml');
    });
});
