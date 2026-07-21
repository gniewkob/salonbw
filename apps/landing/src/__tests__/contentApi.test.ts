import {
    getContentSection,
    getFounderMessage,
    getSalonGallery,
} from '@/utils/contentApi';
import { SALON_GALLERY } from '@/config/content';

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
});
