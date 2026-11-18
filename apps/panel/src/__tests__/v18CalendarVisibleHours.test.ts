import { expandSlotBoundsForVisibleEvents } from '@/utils/openingHoursCalendar';

const base = {
    slotMinTime: '08:00:00',
    slotMaxTime: '17:00:00',
};

const friday = new Date(2026, 10, 20, 12, 0);
const monday = new Date(2026, 10, 23, 12, 0);

function timed(
    year: number,
    month: number,
    day: number,
    startHour: number,
    startMinute: number,
    endHour: number,
    endMinute: number,
) {
    return {
        startTime: new Date(
            year, month - 1, day, startHour, startMinute,
        ).toISOString(),
        endTime: new Date(
            year, month - 1, day, endHour, endMinute,
        ).toISOString(),
    };
}

describe('V18 FullCalendar day/week visible hours', () => {
    it('includes a real 21:00 appointment after weekly salon closing', () => {
        const events = [timed(2026, 11, 20, 21, 0, 22, 20)];
        const result = expandSlotBoundsForVisibleEvents(
            base, events, friday, 'day',
        );
        expect(result.slotMinTime).toBe('08:00:00');
        expect(result.slotMaxTime).toBe('24:00:00');
    });

    it('shows appointments outside hours in week view without changing business hours', () => {
        const events = [
            timed(2026, 11, 20, 21, 0, 21, 45),
            timed(2026, 11, 18, 6, 30, 7, 30),
        ];
        expect(expandSlotBoundsForVisibleEvents(
            base, events, friday, 'week',
        )).toEqual({
            slotMinTime: '05:00:00',
            slotMaxTime: '23:00:00',
        });
    });

    it('ignores appointments from outside the visible day or week', () => {
        const events = [timed(2026, 11, 20, 21, 0, 22, 0)];
        expect(expandSlotBoundsForVisibleEvents(
            base, events, monday, 'day',
        )).toEqual(base);
        expect(expandSlotBoundsForVisibleEvents(
            base, events, monday, 'week',
        )).toEqual(base);
    });

    it('keeps the configured grid when there are no exceptions', () => {
        expect(expandSlotBoundsForVisibleEvents(
            base,
            [timed(2026, 11, 20, 9, 30, 10, 50)],
            friday,
            'day',
        )).toEqual(base);
    });

    it('includes an appointment spanning midnight on both relevant days', () => {
        const start = new Date(2026, 10, 20, 23, 30);
        const end = new Date(2026, 10, 21, 1, 15);
        const events = [{
            startTime: start.toISOString(),
            endTime: end.toISOString(),
        }];
        expect(expandSlotBoundsForVisibleEvents(
            base, events, friday, 'day',
        ).slotMaxTime).toBe('24:00:00');
        expect(expandSlotBoundsForVisibleEvents(
            base, events, new Date(2026, 10, 21, 12), 'day',
        ).slotMinTime).toBe('00:00:00');
    });

    it('never expands month view or due to invalid and all-day entries', () => {
        const events = [
            { ...timed(2026, 11, 20, 21, 0, 23, 0), allDay: true },
            { startTime: 'invalid', endTime: 'invalid' },
            { startTime: '2026-11-20', endTime: '2026-11-20' },
        ];
        expect(expandSlotBoundsForVisibleEvents(
            base, events, friday, 'day',
        )).toEqual(base);
        expect(expandSlotBoundsForVisibleEvents(
            base, [timed(2026, 11, 20, 21, 0, 22, 0)], friday, 'month',
        )).toEqual(base);
    });
});
