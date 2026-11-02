import { CREATIVE_DIRECTIONS, normalizeCreativeDirection } from '@/components/CreativeDirectionStudio';

describe('WDI v2 development-only creative direction contract', () => {
    it('offers three deliberately distinct, stable preview keys', () => {
        expect(CREATIVE_DIRECTIONS).toEqual(['fashion', 'cinematic', 'atelier']);
    });

    it('rejects unrecognized or unsafe edition keys rather than injecting CSS classes', () => {
        for (const value of [null, undefined, '', 'unknown', 'fashion<script>', 'production']) {
            expect(normalizeCreativeDirection(value)).toBeNull();
        }
        for (const key of CREATIVE_DIRECTIONS) {
            expect(normalizeCreativeDirection(key)).toBe(key);
        }
    });
});
