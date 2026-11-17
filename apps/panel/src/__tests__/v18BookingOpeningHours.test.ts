import {
    evaluateBookingOpeningHours,
} from '@/utils/v18BookingOpeningHours';
import type { WeeklyHours } from '@/utils/openingHoursCalendar';

const hours: WeeklyHours = {
    mon: [{ open: '09:00', close: '18:00' }],
    tue: [{ open: '09:00', close: '18:00' }],
    wed: [{ open: '09:00', close: '18:00' }],
    thu: [{ open: '09:00', close: '18:00' }],
    fri: [{ open: '09:00', close: '18:00' }],
    sat: [{ open: '10:00', close: '14:00' }],
    sun: [],
};

function booking(start: string, minutes: number) {
    const s = new Date(start);
    return evaluateBookingOpeningHours(
        s,
        new Date(s.getTime() + minutes * 60_000),
        { source: 'timetables', hours },
    );
}

describe('Studio V18 explicit manual opening-hours exception', () => {
    it('keeps a service fully inside confirmed Warsaw working hours', () => {
        expect(booking('2026-11-17T16:00:00+01:00', 45).status).toBe('within');
        expect(booking('2026-11-17T17:15:00+01:00', 45).status).toBe('within');
    });

    it('warns for late evening bookings even if no appointment conflicts', () => {
        const result = booking('2026-11-17T21:19:00+01:00', 45);
        expect(result.status).toBe('outside');
        expect(result.displayHours).toBe('09:00–18:00');
    });

    it('warns when appointment starts inside hours but extends beyond closing', () => {
        expect(booking('2026-11-17T17:30:00+01:00', 45).status).toBe('outside');
    });

    it('warns on closed days and between disjoint shifts', () => {
        expect(booking('2026-11-22T10:00:00+01:00', 45).status).toBe('outside');
        const split: WeeklyHours = { ...hours, tue: [
            { open: '09:00', close: '12:00' },
            { open: '13:00', close: '18:00' },
        ] };
        const start = new Date('2026-11-17T11:45:00+01:00');
        expect(evaluateBookingOpeningHours(
            start,
            new Date(start.getTime() + 45 * 60_000),
            { source: 'timetables', hours: split },
        ).status).toBe('outside');
    });

    it('uses Europe/Warsaw rather than the browser or UTC clock', () => {
        expect(booking('2026-07-07T18:10:00+02:00', 45).status).toBe('outside');
    });

    it('fails closed when the schedule is unavailable or fallback-only', () => {
        const start = new Date('2026-11-17T10:00:00+01:00');
        const end = new Date(start.getTime() + 45 * 60_000);
        expect(evaluateBookingOpeningHours(start, end, null).status).toBe('unknown');
        expect(evaluateBookingOpeningHours(start, end, {
            source: 'default', hours,
        }).status).toBe('unknown');
        expect(evaluateBookingOpeningHours(start, end, {
            source: 'branch', hours: { ...hours, tue: undefined } as unknown as WeeklyHours,
        }).status).toBe('unknown');
        expect(evaluateBookingOpeningHours(start, start, {
            source: 'timetables', hours,
        }).status).toBe('unknown');
    });
});
