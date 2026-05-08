import type { Appointment } from '@/types';
import {
    getAppointmentPriority,
    hasCustomerAlert,
    isOverdueAppointmentAt,
    isPriorityAppointment,
} from '@/components/calendar/receptionUtils';

function buildAppointment(
    id: number,
    status: Appointment['status'],
    startTime: string,
): Appointment {
    return {
        id,
        status,
        startTime,
        endTime: '2026-05-08T11:30:00.000Z',
        client: { id, name: `Klient ${id}` },
        service: {
            id: 1,
            name: 'Usługa',
            duration: 30,
            price: 100,
            priceType: 'fixed',
            isActive: true,
            onlineBooking: true,
            sortOrder: 0,
        },
        employee: { id: 1, name: 'Pracownik' },
    };
}

describe('receptionUtils', () => {
    const now = new Date('2026-05-08T12:00:00.000Z');

    it('detects overdue only for scheduled appointments in the past on the same day', () => {
        const scheduledPast = buildAppointment(
            1,
            'scheduled',
            '2026-05-08T10:00:00.000Z',
        );
        const scheduledFuture = buildAppointment(
            2,
            'scheduled',
            '2026-05-08T13:00:00.000Z',
        );
        const scheduledPastYesterday = buildAppointment(
            3,
            'scheduled',
            '2026-05-07T10:00:00.000Z',
        );
        const inProgressPast = buildAppointment(
            4,
            'in_progress',
            '2026-05-08T10:00:00.000Z',
        );

        expect(isOverdueAppointmentAt(scheduledPast, now)).toBe(true);
        expect(isOverdueAppointmentAt(scheduledFuture, now)).toBe(false);
        expect(isOverdueAppointmentAt(scheduledPastYesterday, now)).toBe(false);
        expect(isOverdueAppointmentAt(inProgressPast, now)).toBe(false);
    });

    it('derives customer alerts from severity map', () => {
        const withAlert = buildAppointment(
            10,
            'scheduled',
            '2026-05-08T13:00:00.000Z',
        );
        const withoutAlert = buildAppointment(
            11,
            'scheduled',
            '2026-05-08T13:00:00.000Z',
        );

        expect(hasCustomerAlert(withAlert, { 10: 'warning' })).toBe(true);
        expect(hasCustomerAlert(withoutAlert, { 10: 'warning' })).toBe(false);
    });

    it('assigns priority: overdue > in_progress > alert > default', () => {
        const overdue = buildAppointment(
            20,
            'scheduled',
            '2026-05-08T09:00:00.000Z',
        );
        const inProgress = buildAppointment(
            21,
            'in_progress',
            '2026-05-08T13:00:00.000Z',
        );
        const withAlert = buildAppointment(
            22,
            'scheduled',
            '2026-05-08T13:00:00.000Z',
        );
        const normal = buildAppointment(
            23,
            'completed',
            '2026-05-08T13:00:00.000Z',
        );
        const map = { 22: 'danger' };

        expect(getAppointmentPriority(overdue, now, map)).toBe(0);
        expect(getAppointmentPriority(inProgress, now, map)).toBe(1);
        expect(getAppointmentPriority(withAlert, now, map)).toBe(2);
        expect(getAppointmentPriority(normal, now, map)).toBe(3);
    });

    it('classifies priority appointments correctly', () => {
        const overdue = buildAppointment(
            30,
            'scheduled',
            '2026-05-08T09:00:00.000Z',
        );
        const inProgress = buildAppointment(
            31,
            'in_progress',
            '2026-05-08T13:00:00.000Z',
        );
        const withAlert = buildAppointment(
            32,
            'scheduled',
            '2026-05-08T13:00:00.000Z',
        );
        const completed = buildAppointment(
            33,
            'completed',
            '2026-05-08T13:00:00.000Z',
        );
        const map = { 32: 'warning' };

        expect(isPriorityAppointment(overdue, now, map)).toBe(true);
        expect(isPriorityAppointment(inProgress, now, map)).toBe(true);
        expect(isPriorityAppointment(withAlert, now, map)).toBe(true);
        expect(isPriorityAppointment(completed, now, map)).toBe(false);
    });
});
