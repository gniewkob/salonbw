import { resolveCalendarAppointmentMove } from '@/utils/calendarAppointmentMove';

describe('calendar drag-and-drop / resize persistence guard', () => {
    const start = new Date('2026-11-16T09:00:00.000Z');
    const end = new Date('2026-11-16T09:45:00.000Z');

    it('accepts a valid appointment move while retaining Date objects', () => {
        expect(resolveCalendarAppointmentMove('appointment-42', start, end)).toEqual({
            id: 42,
            start,
            end,
        });
    });

    it.each([
        'time_block-42',
        'appointment-',
        'appointment-0',
        'appointment--1',
        'appointment-1-extra',
        'appointment-NaN',
        'appointment-9007199254740992',
    ])('rejects non-appointment or invalid event IDs: %s', (eventId) => {
        expect(resolveCalendarAppointmentMove(eventId, start, end)).toBeNull();
    });

    it('rejects a missing start/end returned by FullCalendar', () => {
        expect(resolveCalendarAppointmentMove('appointment-42', null, end)).toBeNull();
        expect(resolveCalendarAppointmentMove('appointment-42', start, null)).toBeNull();
    });

    it('rejects invalid and non-positive time ranges', () => {
        expect(
            resolveCalendarAppointmentMove('appointment-42', new Date(NaN), end),
        ).toBeNull();
        expect(
            resolveCalendarAppointmentMove('appointment-42', start, new Date(NaN)),
        ).toBeNull();
        expect(resolveCalendarAppointmentMove('appointment-42', start, start)).toBeNull();
        expect(
            resolveCalendarAppointmentMove(
                'appointment-42',
                new Date('2026-11-16T11:00:00.000Z'),
                end,
            ),
        ).toBeNull();
    });
});
