import type { Appointment } from '@/types';

export function isOverdueAppointmentAt(
    appointment: Appointment,
    now: Date,
): boolean {
    const status = appointment.status ?? 'scheduled';
    if (status !== 'scheduled') return false;

    const startTime = new Date(appointment.startTime);
    if (Number.isNaN(startTime.getTime())) return false;

    return (
        startTime.getFullYear() === now.getFullYear() &&
        startTime.getMonth() === now.getMonth() &&
        startTime.getDate() === now.getDate() &&
        startTime.getTime() < now.getTime()
    );
}

export function hasCustomerAlert(
    appointment: Appointment,
    customerAlertSeverityByCustomerId: Record<number, unknown>,
): boolean {
    const customerId = appointment.client?.id;
    return customerId
        ? Boolean(customerAlertSeverityByCustomerId[customerId])
        : false;
}

export function getAppointmentPriority(
    appointment: Appointment,
    now: Date,
    customerAlertSeverityByCustomerId: Record<number, unknown>,
): number {
    if (isOverdueAppointmentAt(appointment, now)) return 0;
    if ((appointment.status ?? 'scheduled') === 'in_progress') return 1;
    if (hasCustomerAlert(appointment, customerAlertSeverityByCustomerId))
        return 2;
    return 3;
}

export function isPriorityAppointment(
    appointment: Appointment,
    now: Date,
    customerAlertSeverityByCustomerId: Record<number, unknown>,
): boolean {
    return (
        isOverdueAppointmentAt(appointment, now) ||
        (appointment.status ?? 'scheduled') === 'in_progress' ||
        hasCustomerAlert(appointment, customerAlertSeverityByCustomerId)
    );
}
