import type { CalendarEvent } from '@/types';
import { resolveCalendarAppointmentMove, calendarEventForDisplay } from '@/utils/calendarAppointmentMove';

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


describe('V18 drag preview uses FullCalendar event times, not original server snapshot', () => {
    const event = {
        id: 42,
        type: 'appointment',
        startTime: '2026-11-17T09:00:00.000Z',
        endTime: '2026-11-17T09:45:00.000Z',
        status: 'confirmed',
        title: 'Synthetic appointment',
    } as CalendarEvent;

    it('shows the proposed destination and keeps source data unchanged', () => {
        const preview = calendarEventForDisplay(
            event,
            new Date('2026-11-17T10:15:00.000Z'),
            new Date('2026-11-17T11:00:00.000Z'),
        );
        expect(preview.startTime).toBe('2026-11-17T10:15:00.000Z');
        expect(preview.endTime).toBe('2026-11-17T11:00:00.000Z');
        expect(preview.status).toBe('confirmed');
        expect(event.startTime).toBe('2026-11-17T09:00:00.000Z');
        expect(preview).not.toBe(event);
    });

    it('falls back to the original event on missing or invalid dates', () => {
        expect(calendarEventForDisplay(event, null, new Date())).toBe(event);
        expect(
            calendarEventForDisplay(event, new Date(NaN), new Date()),
        ).toBe(event);
        expect(
            calendarEventForDisplay(
                event,
                new Date('2026-11-17T11:00:00.000Z'),
                new Date('2026-11-17T10:15:00.000Z'),
            ),
        ).toBe(event);
    });

    it('does not rewrite time-block events', () => {
        const timeBlock = {
            ...event,
            type: 'time_block',
        } as CalendarEvent;
        expect(
            calendarEventForDisplay(
                timeBlock,
                new Date('2026-11-17T10:15:00.000Z'),
                new Date('2026-11-17T11:00:00.000Z'),
            ),
        ).toBe(timeBlock);
    });
});
