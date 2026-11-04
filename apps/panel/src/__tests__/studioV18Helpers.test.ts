import {
    decodeSavedStudioModules,
    studioV18CalendarUrl,
} from '@/utils/studioV18Helpers';

describe('Studio V18 functional helpers', () => {
    const allowed = ['/calendar', '/customers', '/statistics'];

    it('builds deep links to the actual selected calendar date', () => {
        expect(studioV18CalendarUrl(2026, 10, 4)).toBe(
            '/calendar?date=2026-11-04',
        );
        expect(studioV18CalendarUrl(2027, 0, 9)).toBe(
            '/calendar?date=2027-01-09',
        );
        expect(studioV18CalendarUrl(2028, 1, 29)).toBe(
            '/calendar?date=2028-02-29',
        );
    });

    it('restores only known module URLs and removes duplicates', () => {
        expect(
            decodeSavedStudioModules(
                JSON.stringify([
                    '/calendar',
                    '/calendar',
                    '/not-an-app-link',
                    123,
                    null,
                    '/statistics',
                ]),
                allowed,
            ),
        ).toEqual(['/calendar', '/statistics']);
    });

    it('handles malformed and inaccessible saved data without exposing URLs', () => {
        expect(decodeSavedStudioModules(null, allowed)).toEqual([]);
        expect(decodeSavedStudioModules('{bad', allowed)).toEqual([]);
        expect(
            decodeSavedStudioModules('{"href":"/calendar"}', allowed),
        ).toEqual([]);
        expect(
            decodeSavedStudioModules(
                JSON.stringify(['https://attacker.invalid', '//evil.invalid']),
                allowed,
            ),
        ).toEqual([]);
    });
});
