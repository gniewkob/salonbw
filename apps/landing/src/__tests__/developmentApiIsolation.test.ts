import { resolveApiBaseUrl } from '@/utils/contentApi';

describe('development API isolation', () => {
    const original = { ...process.env };
    afterEach(() => {
        process.env = { ...original };
    });
    it('refuses server-side production fallback when development has no API configuration', () => {
        process.env.NEXT_PUBLIC_DEPLOYMENT_ENV = 'development';
        delete process.env.API_PROXY_URL;
        delete process.env.API_BASE_URL;
        expect(() => resolveApiBaseUrl('/api', true)).toThrow();
    });
    it('uses the explicitly configured dev API and leaves browser requests on the local proxy', () => {
        process.env.NEXT_PUBLIC_DEPLOYMENT_ENV = 'development';
        process.env.API_PROXY_URL = 'https://dev-api.salon-bw.pl';
        expect(resolveApiBaseUrl('/api', true)).toBe(
            'https://dev-api.salon-bw.pl',
        );
        expect(resolveApiBaseUrl('/api', false)).toBe('/api');
        expect(() =>
            resolveApiBaseUrl('https://api.salon-bw.pl', true),
        ).toThrow();
    });
});
