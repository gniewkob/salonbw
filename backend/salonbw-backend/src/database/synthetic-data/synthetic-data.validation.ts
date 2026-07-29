import {
    SyntheticAppointmentStatus,
    SyntheticAppointmentWindow,
    SyntheticScheduleValidationInput,
    SyntheticWorkingDay,
} from './synthetic-data.types';
import { warsawDateKey, warsawMinuteOfDay } from './synthetic-data.schedule';

const HISTORICAL_STATUSES = new Set<SyntheticAppointmentStatus>([
    'cancelled',
    'completed',
    'no_show',
]);

function violation(key: string, code: string): string {
    return `${key}:${code}`;
}

function hasFiniteTime(value: Date): boolean {
    return value instanceof Date && Number.isFinite(value.getTime());
}

function hasWorkingRange(
    day: SyntheticWorkingDay,
    startMinute: number,
    endMinute: number,
): boolean {
    return day.ranges.some(
        (range) =>
            range.startMinute <= startMinute && endMinute <= range.endMinute,
    );
}

function hasAnchorWorkingRange(
    workingDays: SyntheticWorkingDay[],
    anchorDate: Date,
): boolean {
    const anchorDateKey = warsawDateKey(anchorDate);
    const anchorDays = workingDays.filter((day) => day.date === anchorDateKey);
    const anchorMinute = warsawMinuteOfDay(anchorDate);

    return (
        anchorDays.length === 1 &&
        anchorDays[0].ranges.some(
            (range) =>
                range.startMinute <= anchorMinute &&
                anchorMinute < range.endMinute,
        )
    );
}

function hasValidStatusTime(
    appointment: SyntheticAppointmentWindow,
    anchorDate: Date,
    anchorWorkingRange: boolean,
): boolean {
    const start = appointment.startTime.getTime();
    const end = appointment.endTime.getTime();
    const anchor = anchorDate.getTime();

    if (HISTORICAL_STATUSES.has(appointment.status)) return end < anchor;
    if (appointment.status === 'in_progress') {
        return start <= anchor && anchor < end && anchorWorkingRange;
    }
    return start > anchor;
}

export function collectSyntheticScheduleViolations(
    input: SyntheticScheduleValidationInput,
): string[] {
    const violations: string[] = [];
    const validIntervals: SyntheticAppointmentWindow[] = [];
    const anchorWorkingRange = hasFiniteTime(input.anchorDate)
        ? hasAnchorWorkingRange(input.workingDays, input.anchorDate)
        : false;

    for (const appointment of input.appointments) {
        if (
            !hasFiniteTime(appointment.startTime) ||
            !hasFiniteTime(appointment.endTime) ||
            appointment.startTime >= appointment.endTime
        ) {
            violations.push(
                violation(
                    appointment.key,
                    'SYNTHETIC_APPOINTMENT_TIME_INVALID',
                ),
            );
            continue;
        }

        if (appointment.employeeId !== input.ownerUserId) {
            violations.push(
                violation(appointment.key, 'SYNTHETIC_APPOINTMENT_EMPLOYEE'),
            );
        }

        const appointmentDateKey = warsawDateKey(appointment.startTime);
        const appointmentDays = input.workingDays.filter(
            (day) => day.date === appointmentDateKey,
        );
        if (appointmentDays.length === 0) {
            violations.push(
                violation(
                    appointment.key,
                    'SYNTHETIC_APPOINTMENT_SCHEDULE_DAY_MISSING',
                ),
            );
        } else if (appointmentDays.length > 1) {
            violations.push(
                violation(
                    appointment.key,
                    'SYNTHETIC_APPOINTMENT_SCHEDULE_DAY_AMBIGUOUS',
                ),
            );
        } else if (
            warsawDateKey(appointment.endTime) !== appointmentDateKey ||
            !hasWorkingRange(
                appointmentDays[0],
                warsawMinuteOfDay(appointment.startTime),
                warsawMinuteOfDay(appointment.endTime),
            )
        ) {
            violations.push(
                violation(
                    appointment.key,
                    'SYNTHETIC_APPOINTMENT_OUTSIDE_SCHEDULE',
                ),
            );
        }

        if (
            !hasFiniteTime(input.anchorDate) ||
            !hasValidStatusTime(
                appointment,
                input.anchorDate,
                anchorWorkingRange,
            )
        ) {
            violations.push(
                violation(appointment.key, 'SYNTHETIC_APPOINTMENT_STATUS_TIME'),
            );
        }

        validIntervals.push(appointment);
    }

    let latestEnd = Number.NEGATIVE_INFINITY;
    for (const appointment of validIntervals.sort(
        (left, right) =>
            left.startTime.getTime() - right.startTime.getTime() ||
            left.endTime.getTime() - right.endTime.getTime() ||
            left.key.localeCompare(right.key),
    )) {
        if (appointment.startTime.getTime() < latestEnd) {
            violations.push(
                violation(appointment.key, 'SYNTHETIC_APPOINTMENT_OVERLAP'),
            );
        }
        latestEnd = Math.max(latestEnd, appointment.endTime.getTime());
    }

    return violations;
}

export function assertSyntheticScheduleValid(
    input: SyntheticScheduleValidationInput,
): void {
    const violations = collectSyntheticScheduleViolations(input);
    if (violations.length > 0) throw new Error(violations.join(', '));
}
