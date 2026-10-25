import { LANDING_URL_FALLBACK, landingUrl } from '@/utils/landingUrl';

describe('landingUrl', () => {
    const original = process.env.NEXT_PUBLIC_LANDING_URL;

    afterEach(() => {
        if (original === undefined) {
            delete process.env.NEXT_PUBLIC_LANDING_URL;
        } else {
            process.env.NEXT_PUBLIC_LANDING_URL = original;
        }
    });

    it('uses the configured landing (dev until the domain cutover)', () => {
        process.env.NEXT_PUBLIC_LANDING_URL = 'https://dev.salon-bw.pl';
        expect(landingUrl('/privacy')).toBe('https://dev.salon-bw.pl/privacy');
        expect(landingUrl()).toBe('https://dev.salon-bw.pl/');
    });

    it('falls back to the production site when unset or blank', () => {
        delete process.env.NEXT_PUBLIC_LANDING_URL;
        expect(landingUrl('/policy')).toBe('https://salon-bw.pl/policy');
        process.env.NEXT_PUBLIC_LANDING_URL = '   ';
        expect(landingUrl('/policy')).toBe('https://salon-bw.pl/policy');
        expect(LANDING_URL_FALLBACK).toBe('https://salon-bw.pl');
    });

    it('falls back when the configured value is not a URL', () => {
        process.env.NEXT_PUBLIC_LANDING_URL = 'not a url';
        expect(landingUrl('/privacy')).toBe('https://salon-bw.pl/privacy');
    });
});
