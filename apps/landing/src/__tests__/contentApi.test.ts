import {
    getContentSection,
    getFounderMessage,
    getSalonGallery,
    resolveApiBaseUrl,
} from '@/utils/contentApi';
import { SALON_GALLERY } from '@/config/content';
import { getStaticProps } from '@/pages/index';

describe('contentApi', () => {
    beforeEach(() => {
        (global.fetch as jest.Mock).mockReset();
    });

    it('fetches CMS sections using the API snake_case key', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                id: 3,
                key: 'founder_message',
                data: {
                    name: 'Aleksandra',
                    quote: 'CMS quote',
                    photo: '/founder.jpg',
                },
                description: null,
                isActive: true,
                createdAt: '2026-02-15T21:17:14.498Z',
                updatedAt: '2026-02-15T21:17:14.498Z',
            }),
        });

        await expect(getFounderMessage()).resolves.toEqual({
            name: 'Aleksandra',
            quote: 'CMS quote',
            photo: '/founder.jpg',
        });
        expect(global.fetch).toHaveBeenCalledWith(
            'http://localhost/content/sections/founder_message',
            expect.objectContaining({
                headers: { Accept: 'application/json' },
            }),
        );
    });

    it('rejects missing CMS content instead of returning local content', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            status: 404,
            json: async () => ({}),
        });

        await expect(getFounderMessage()).rejects.toThrow(
            'Failed to fetch FOUNDER_MESSAGE',
        );
    });

    it('fails home-page generation when founder content is unavailable', async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(
            new Error('CMS unavailable'),
        );

        await expect(getStaticProps({} as never)).rejects.toThrow(
            'CMS unavailable',
        );
    });

    it('rejects sections that are not managed by CMS', async () => {
        await expect(getContentSection('SALON_GALLERY')).rejects.toThrow(
            'SALON_GALLERY is not managed by CMS',
        );
        expect(global.fetch).not.toHaveBeenCalled();
    });

    it('keeps the salon gallery as explicit static content', async () => {
        await expect(getSalonGallery()).resolves.toBe(SALON_GALLERY);
        expect(global.fetch).not.toHaveBeenCalled();
    });

    describe('resolveApiBaseUrl (regression for #1462)', () => {
        const originalProxy = process.env.API_PROXY_URL;
        const originalBase = process.env.API_BASE_URL;

        afterEach(() => {
            if (originalProxy === undefined) delete process.env.API_PROXY_URL;
            else process.env.API_PROXY_URL = originalProxy;
            if (originalBase === undefined) delete process.env.API_BASE_URL;
            else process.env.API_BASE_URL = originalBase;
        });

        it('maps a relative "/api" base to the absolute proxy origin on the server (SSG/ISR)', () => {
            delete process.env.API_PROXY_URL;
            delete process.env.API_BASE_URL;
            // The Next.js rewrite strips the leading /api segment, so the
            // server-side equivalent of "/api" is the proxy target root.
            expect(resolveApiBaseUrl('/api', true)).toBe(
                'https://api.salon-bw.pl',
            );
        });

        it('honours API_PROXY_URL when mapping a relative base on the server', () => {
            process.env.API_PROXY_URL = 'https://staging-api.example.com/';
            expect(resolveApiBaseUrl('/api', true)).toBe(
                'https://staging-api.example.com',
            );
        });

        it('preserves extra path segments after /api', () => {
            delete process.env.API_PROXY_URL;
            delete process.env.API_BASE_URL;
            expect(resolveApiBaseUrl('/api/v2', true)).toBe(
                'https://api.salon-bw.pl/v2',
            );
        });

        it('keeps a relative base as-is in the browser', () => {
            expect(resolveApiBaseUrl('/api', false)).toBe('/api');
        });

        it('passes an already-absolute base through unchanged', () => {
            expect(resolveApiBaseUrl('http://localhost', true)).toBe(
                'http://localhost',
            );
            expect(resolveApiBaseUrl('https://api.salon-bw.pl', false)).toBe(
                'https://api.salon-bw.pl',
            );
        });
    });
});
