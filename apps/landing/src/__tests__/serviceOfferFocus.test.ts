import {
    parseServiceOffer,
    resolveOfferCategories,
} from '@/utils/serviceOfferFocus';

describe('landing offer deep-links', () => {
    const categories = [
        {
            name: 'Fryzjerstwo damskie',
            services: [{ name: 'Strzyżenie damskie' }],
        },
        {
            name: 'Pielęgnacja włosów',
            services: [{ name: 'Zabieg Olaplex' }],
        },
        {
            name: 'Przedłużanie i zagęszczanie włosów',
            services: [{ name: 'HairTalk' }],
        },
    ];

    it.each([
        ['hairdressing', 'Fryzjerstwo damskie'],
        ['care', 'Pielęgnacja włosów'],
        ['extensions', 'Przedłużanie i zagęszczanie włosów'],
    ] as const)('resolves %s from live-category labels', (offer, expected) => {
        expect(resolveOfferCategories(categories, offer)).toEqual([expected]);
    });

    it('prefers a dedicated category over an unrelated category containing matching services', () => {
        expect(
            resolveOfferCategories(
                [
                    {
                        name: 'Fryzjerstwo',
                        services: [
                            { name: 'HairTalk przedłużanie' },
                            { name: 'Strzyżenie' },
                        ],
                    },
                    { name: 'Doczepianie włosów', services: [] },
                ],
                'extensions',
            ),
        ).toEqual(['Doczepianie włosów']);
    });

    it('shows BOTH haircut and colouring categories for the hairdressing card', () => {
        const actualBooksyCategoryShapes = [
            { name: 'Fryzjerstwo', services: [{ name: 'Strzyżenie damskie' }] },
            { name: 'Koloryzacja', services: [{ name: 'Air Touch' }] },
            { name: 'Pielęgnacja', services: [{ name: 'Olaplex' }] },
        ];

        expect(
            resolveOfferCategories(actualBooksyCategoryShapes, 'hairdressing'),
        ).toEqual(['Fryzjerstwo', 'Koloryzacja']);
    });

    it('falls back to the entire catalog if no current category matches', () => {
        expect(
            resolveOfferCategories(
                [{ name: 'Inne', services: [{ name: 'Wizyta konsultacyjna' }] }],
                'care',
            ),
        ).toEqual([]);
        expect(resolveOfferCategories([], 'extensions')).toEqual([]);
        expect(resolveOfferCategories(categories, null)).toEqual([]);
    });

    it('rejects unknown, duplicate, and malformed URL parameters', () => {
        expect(parseServiceOffer('care')).toBe('care');
        expect(parseServiceOffer('extensions')).toBe('extensions');
        expect(parseServiceOffer('invalid')).toBeNull();
        expect(parseServiceOffer(['care', 'extensions'])).toBeNull();
        expect(parseServiceOffer(null)).toBeNull();
    });
});
