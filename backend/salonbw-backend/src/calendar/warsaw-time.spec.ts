import {
    warsawCalendarDayBounds,
    warsawWallClockComparable,
    warsawWallClockInstants,
} from './warsaw-time';

describe('salon Warsaw calendar conversion (independent of server TZ)', () => {
    it('maps 09:00 winter and summer business hours to the right UTC instant', () => {
        expect(
            warsawWallClockInstants('2026-01-15', 9 * 60).map((t) =>
                t.toISOString(),
            ),
        ).toEqual(['2026-01-15T08:00:00.000Z']);
        expect(
            warsawWallClockInstants('2026-06-15', 9 * 60).map((t) =>
                t.toISOString(),
            ),
        ).toEqual(['2026-06-15T07:00:00.000Z']);
    });

    it('rejects nonexistent wall-clock times during spring-forward', () => {
        expect(warsawWallClockInstants('2026-03-29', 2 * 60 + 30)).toEqual([]);
        expect(
            warsawWallClockInstants('2026-03-29', 3 * 60 + 30).map((t) =>
                t.toISOString(),
            ),
        ).toEqual(['2026-03-29T01:30:00.000Z']);
    });

    it('exposes both distinct real instants during autumn repeated hour', () => {
        expect(
            warsawWallClockInstants('2026-10-25', 2 * 60 + 30).map((t) =>
                t.toISOString(),
            ),
        ).toEqual([
            '2026-10-25T00:30:00.000Z',
            '2026-10-25T01:30:00.000Z',
        ]);
    });

    it('uses exact Warsaw-local midnights for 23/25-hour days and the next day', () => {
        const spring = warsawCalendarDayBounds('2026-03-29');
        expect(spring.start.toISOString()).toBe('2026-03-28T23:00:00.000Z');
        expect(spring.endExclusive.toISOString()).toBe(
            '2026-03-29T22:00:00.000Z',
        );
        expect(
            (spring.endExclusive.getTime() - spring.start.getTime()) / 3_600_000,
        ).toBe(23);

        const autumn = warsawCalendarDayBounds('2026-10-25');
        expect(autumn.start.toISOString()).toBe('2026-10-24T22:00:00.000Z');
        expect(autumn.endExclusive.toISOString()).toBe(
            '2026-10-25T23:00:00.000Z',
        );
        expect(
            (autumn.endExclusive.getTime() - autumn.start.getTime()) / 3_600_000,
        ).toBe(25);
    });

    it('compares wall-clock closing time instead of server-local Date', () => {
        const closed = Date.parse('2026-03-29T00:00:00.000Z') + 4 * 3_600_000;
        expect(
            warsawWallClockComparable(new Date('2026-03-29T01:30:00.000Z')),
        ).toBeLessThan(closed);
        expect(
            warsawWallClockComparable(new Date('2026-03-29T02:30:00.000Z')),
        ).toBeGreaterThan(closed);
    });

    it('rejects invalid dates and out-of-range minutes', () => {
        expect(() => warsawWallClockInstants('2026-02-30', 540)).toThrow(
            RangeError,
        );
        expect(() => warsawWallClockInstants('2026-11-20', -1)).toThrow(
            RangeError,
        );
        expect(() => warsawWallClockInstants('2026-11-20', 1440)).toThrow(
            RangeError,
        );
    });
});
