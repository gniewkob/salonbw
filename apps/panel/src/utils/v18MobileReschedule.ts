import type { CalendarEvent } from '@/types';

const WARSAW_WALL_CLOCK = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Warsaw',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
});

function warsawParts(date: Date) {
    const parts = WARSAW_WALL_CLOCK.formatToParts(date);
    const value = (type: Intl.DateTimeFormatPartTypes) =>
        Number(parts.find((part) => part.type === type)?.value);
    return {
        year: value('year'),
        month: value('month'),
        day: value('day'),
        hour: value('hour'),
        minute: value('minute'),
        second: value('second'),
    };
}

/** API supports rescheduling only active, timed appointments. */
export function canDragAppointment(event: CalendarEvent): boolean {
    return (
        event.type === 'appointment' &&
        (event.status === 'scheduled' || event.status === 'confirmed') &&
        event.allDay !== true
    );
}

/**
 * Keep the salon-local clock time when moving an appointment to another day.
 * A browser may run in a timezone other than Europe/Warsaw.
 * Refuse nonexistent or ambiguous local times at DST transitions instead
 * of silently shifting the appointment by one hour.
 */
export function moveAppointmentToWarsawDay(
    event: CalendarEvent,
    dayKey: string,
): { start: Date; end: Date } | null {
    if (!canDragAppointment(event) || !/^\d{4}-\d{2}-\d{2}$/.test(dayKey)) {
        return null;
    }

    const start = new Date(event.startTime);
    const end = new Date(event.endTime);
    const duration = end.getTime() - start.getTime();
    if (!Number.isFinite(duration) || duration <= 0) return null;

    const [year, month, day] = dayKey.split('-').map(Number);
    const source = warsawParts(start);
    const wallUtc = Date.UTC(
        year,
        month - 1,
        day,
        source.hour,
        source.minute,
        source.second,
        start.getUTCMilliseconds(),
    );
    if (!Number.isFinite(wallUtc)) return null;

    // Warsaw has UTC+1 in winter and UTC+2 during daylight saving time.
    const candidates = [60, 120]
        .map((minutes) => new Date(wallUtc - minutes * 60_000))
        .filter((candidate) => {
            const parts = warsawParts(candidate);
            return (
                parts.year === year &&
                parts.month === month &&
                parts.day === day &&
                parts.hour === source.hour &&
                parts.minute === source.minute &&
                parts.second === source.second
            );
        });
    if (candidates.length !== 1) return null;

    const movedStart = candidates[0];
    return {
        start: movedStart,
        end: new Date(movedStart.getTime() + duration),
    };
}
