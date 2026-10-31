import {
    parseServiceOffer,
    resolveOfferCategory,
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
        expect(resolveOfferCategory(categories, offer)).toBe(expected);
    });

    it('prefers a dedicated category over an unrelated category containing matching services', () => {
        expect(
            resolveOfferCategory(
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
        ).toBe('Doczepianie włosów');
    });

    it('falls back to the entire catalog if no current category matches', () => {
        expect(
            resolveOfferCategory(
                [{ name: 'Inne', services: [{ name: 'Wizyta konsultacyjna' }] }],
                'care',
            ),
        ).toBeNull();
        expect(resolveOfferCategory([], 'extensions')).toBeNull();
        expect(resolveOfferCategory(categories, null)).toBeNull();
    });

    it('rejects unknown, duplicate, and malformed URL parameters', () => {
        expect(parseServiceOffer('care')).toBe('care');
        expect(parseServiceOffer('extensions')).toBe('extensions');
        expect(parseServiceOffer('invalid')).toBeNull();
        expect(parseServiceOffer(['care', 'extensions'])).toBeNull();
        expect(parseServiceOffer(null)).toBeNull();
    });
});
