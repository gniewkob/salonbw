import { isWwwHost, resolveLegacyRedirect } from '@/utils/legacyRedirects';

const PANEL = 'https://panel.salon-bw.pl';

// Paths from the legacy site's sitemap.xml (www.salon-bw.pl, 2026-10-24),
// except "/" which is the same page on the new site.
const LEGACY_SITEMAP_PATHS = [
    '/modals/godziny',
    '/modals/rezerwacja',
    '/modals/adres',
    '/start',
    '/o-nas',
    '/uslugi-fryzjerskie',
    '/uslugi-kosmetyczne',
    '/rytualy-kerastase',
    '/kosmetyki-revitalash',
    '/pakiety-slubne',
    '/stylizacja-paznokci',
    '/karta-podarunkowa',
    '/solarium',
    '/cennik-fryzjerstwo-damskie',
    '/cennik-fryzjerstwo-meskie',
    '/cennik-kosmetyka',
    '/cennik-stylizacja-paznokci',
    '/news',
    '/kontakt',
    '/uslugi-fryzjerskie/baleyage',
    '/uslugi-fryzjerskie/koloryzacja',
    '/uslugi-fryzjerskie/dekoloryzacja',
    '/uslugi-fryzjerskie/strzyzenie-damskie',
    '/uslugi-fryzjerskie/modelowanie',
    '/uslugi-fryzjerskie/fryzury-komunijne',
    '/uslugi-fryzjerskie/fryzury-slubne',
    '/uslugi-fryzjerskie/upiecia-koki',
    '/uslugi-fryzjerskie/trwala-podnoszaca',
    '/uslugi-fryzjerskie/trwala-skrecajaca',
    '/uslugi-fryzjerskie/przedluzanie-wlosow',
    '/uslugi-fryzjerskie/strzyzenie-meskie',
    '/uslugi-fryzjerskie/wycinanie-wzorow',
    '/uslugi-fryzjerskie/keratynowa-terapia',
    '/uslugi-fryzjerskie/spa-sauna-dla-wlosow',
    '/uslugi-fryzjerskie/zabieg-dermabrazji',
    '/uslugi-kosmetyczne/zabiegi-z-kwasami',
    '/uslugi-kosmetyczne/zabiegi-odzywcze',
    '/uslugi-kosmetyczne/zabiegi-odmladzajace-oraz-silnie-liftingujace',
    '/uslugi-kosmetyczne/zabiegi-uszczelniajace-naczynia-krwionosne',
    '/uslugi-kosmetyczne/masaz-twarzy-szyi-dekoltu',
    '/uslugi-kosmetyczne/oczyszczanie-twarzy',
    '/uslugi-kosmetyczne/depilacja-cieplym-woskiem',
    '/uslugi-kosmetyczne/henna-regulacja-luku-brwiowego',
    '/uslugi-kosmetyczne/peeling-kawitacyjny',
    '/uslugi-kosmetyczne/sonoforeza',
    '/uslugi-kosmetyczne/ultradzwieki',
    '/uslugi-kosmetyczne/jonoforeza',
    '/uslugi-kosmetyczne/galwanizacja',
    '/uslugi-kosmetyczne/prady-dArsonwala',
    '/uslugi-kosmetyczne/mezoterapia-beziglowa',
    '/uslugi-kosmetyczne/mikrodermabrazja-diamentowa',
    '/uslugi-kosmetyczne/diagnostyka-lampa-Wooda',
    '/posts/07042015',
];

describe('legacy site redirects', () => {
    it('covers every URL from the legacy sitemap', () => {
        expect(LEGACY_SITEMAP_PATHS).toHaveLength(53);
        const unmapped = LEGACY_SITEMAP_PATHS.filter(
            (path) => resolveLegacyRedirect(path, PANEL) === null,
        );
        expect(unmapped).toEqual([]);
    });

    it('sends every legacy URL to an existing page of the new site', () => {
        const knownTargets = new Set([
            '/',
            '/#about',
            '/contact',
            '/services',
            '/services/balayage',
            '/services/coloring',
            `${PANEL}/booking`,
        ]);
        for (const path of LEGACY_SITEMAP_PATHS) {
            expect(knownTargets).toContain(resolveLegacyRedirect(path, PANEL));
        }
    });

    it('maps the dedicated service pages precisely', () => {
        expect(resolveLegacyRedirect('/uslugi-fryzjerskie/baleyage')).toBe(
            '/services/balayage',
        );
        expect(resolveLegacyRedirect('/uslugi-fryzjerskie/koloryzacja')).toBe(
            '/services/coloring',
        );
        expect(resolveLegacyRedirect('/kontakt')).toBe('/contact');
    });

    it('sends the legacy booking modal to online booking in the panel', () => {
        expect(resolveLegacyRedirect('/modals/rezerwacja', PANEL)).toBe(
            'https://panel.salon-bw.pl/booking',
        );
    });

    it('ignores case and a trailing slash', () => {
        expect(resolveLegacyRedirect('/Kontakt/')).toBe('/contact');
        expect(
            resolveLegacyRedirect(
                '/uslugi-kosmetyczne/diagnostyka-lampa-wooda',
            ),
        ).toBe('/services');
    });

    it('leaves the new site routes alone', () => {
        for (const path of [
            '/',
            '/contact',
            '/services',
            '/services/balayage',
            '/gallery',
            '/privacy',
            '/policy',
            '/data-deletion',
            '/sitemap.xml',
            '/robots.txt',
        ]) {
            expect(resolveLegacyRedirect(path, PANEL)).toBeNull();
        }
    });
});

describe('www host detection', () => {
    it('recognises the legacy www host regardless of case or port', () => {
        expect(isWwwHost('www.salon-bw.pl')).toBe(true);
        expect(isWwwHost('WWW.Salon-BW.pl:443')).toBe(true);
    });

    it('does not treat other hosts as www', () => {
        expect(isWwwHost('salon-bw.pl')).toBe(false);
        expect(isWwwHost('dev.salon-bw.pl')).toBe(false);
        expect(isWwwHost(null)).toBe(false);
    });
});
