import type { CalendarEvent } from '@/types';
import {
    canDragAppointment,
    moveAppointmentToWarsawDay,
} from '@/utils/v18MobileReschedule';

const appointment: CalendarEvent = {
    id: 301,
    type: 'appointment',
    title: 'Strzyżenie',
    startTime: '2026-11-09T09:00:00.000Z',
    endTime: '2026-11-09T09:45:00.000Z',
    employeeId: 7,
    employeeName: 'Aleksandra',
    status: 'confirmed',
};

describe('mobile week DnD Warsaw time conversion', () => {
    it('keeps salon-local appointment time and duration across weekdays', () => {
        expect(moveAppointmentToWarsawDay(appointment, '2026-11-11')).toEqual({
            start: new Date('2026-11-11T09:00:00.000Z'),
            end: new Date('2026-11-11T09:45:00.000Z'),
        });
    });

    it('preserves existing duration and summer time', () => {
        const summer: CalendarEvent = {
            ...appointment,
            startTime: '2026-07-06T07:15:00.000Z',
            endTime: '2026-07-06T09:10:00.000Z',
        };
        expect(moveAppointmentToWarsawDay(summer, '2026-07-08')).toEqual({
            start: new Date('2026-07-08T07:15:00.000Z'),
            end: new Date('2026-07-08T09:10:00.000Z'),
        });
    });

    it('preserves salon clock time across the spring DST change', () => {
        const event: CalendarEvent = {
            ...appointment,
            startTime: '2026-03-28T08:00:00.000Z',
            endTime: '2026-03-28T08:45:00.000Z',
        };
        expect(moveAppointmentToWarsawDay(event, '2026-03-29')).toEqual({
            start: new Date('2026-03-29T07:00:00.000Z'),
            end: new Date('2026-03-29T07:45:00.000Z'),
        });
    });

    it('refuses a nonexistent Warsaw hour during spring DST', () => {
        const event: CalendarEvent = {
            ...appointment,
            startTime: '2026-03-28T01:30:00.000Z',
            endTime: '2026-03-28T02:15:00.000Z',
        };
        expect(moveAppointmentToWarsawDay(event, '2026-03-29')).toBeNull();
    });

    it('refuses an ambiguous Warsaw hour during autumn DST', () => {
        const event: CalendarEvent = {
            ...appointment,
            startTime: '2026-10-24T00:30:00.000Z',
            endTime: '2026-10-24T01:15:00.000Z',
        };
        expect(moveAppointmentToWarsawDay(event, '2026-10-25')).toBeNull();
    });

    it.each(['cancelled', 'online_pending', 'rescheduled_pending'])(
        'does not allow dragging appointments in status %s',
        (status) => {
            const event = { ...appointment, status } as CalendarEvent;
            expect(canDragAppointment(event)).toBe(false);
            expect(moveAppointmentToWarsawDay(event, '2026-11-11')).toBeNull();
        },
    );

    it('never drags time blocks or invalid dates', () => {
        expect(canDragAppointment({ ...appointment, type: 'time_block' })).toBe(
            false,
        );
        expect(
            moveAppointmentToWarsawDay(appointment, '2026-11-31'),
        ).toBeNull();
        expect(
            moveAppointmentToWarsawDay(appointment, '2026-02-30'),
        ).toBeNull();
        expect(moveAppointmentToWarsawDay(appointment, 'broken')).toBeNull();
    });
});
