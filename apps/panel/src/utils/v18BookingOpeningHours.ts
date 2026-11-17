import type { DayKey, OpeningHoursResponse } from '@/utils/openingHoursCalendar';

export type OpeningHoursDecision = {
    status: 'within' | 'outside' | 'unknown';
    displayHours: string;
};

const dayKeys: Record<string, DayKey> = {
    Sun: 'sun', Mon: 'mon', Tue: 'tue', Wed: 'wed',
    Thu: 'thu', Fri: 'fri', Sat: 'sat',
};

const warsawFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Warsaw',
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
});

function warsawFields(value: Date) {
    if (!Number.isFinite(value.getTime())) return null;
    const fields = Object.fromEntries(
        warsawFormatter.formatToParts(value)
            .filter((part) => part.type !== 'literal')
            .map((part) => [part.type, part.value]),
    );
    const day = dayKeys[fields.weekday];
    const hour = Number(fields.hour);
    const minute = Number(fields.minute);
    if (!day || !Number.isInteger(hour) || !Number.isInteger(minute)) return null;
    return {
        day,
        date: `${fields.year}-${fields.month}-${fields.day}`,
        minute: hour * 60 + minute,
    };
}

function minuteOfDay(value: string) {
    if (!/^(?:[01][0-9]|2[0-3]):[0-5][0-9]$/.test(value)) {
        return null;
    }
    const [hour, minute] = value.split(':').map(Number);
    return hour * 60 + minute;
}

/**
 * Weekly salon opening times are an operational warning for manual staff
 * booking, NOT an employee-specific online availability guarantee. Date-
 * specific exceptions and occupancy still require backend checks.
 *
 * A duration must fit entirely into ONE contiguous confirmed opening range.
 * Never treat a missing/default schedule as permission to book silently.
 */
export function evaluateBookingOpeningHours(
    start: Date,
    end: Date,
    payload: OpeningHoursResponse | null | undefined,
): OpeningHoursDecision {
    const unknown: OpeningHoursDecision = {
        status: 'unknown',
        displayHours: 'Nie udało się potwierdzić godzin pracy',
    };
    if (payload?.source !== 'timetables' && payload?.source !== 'branch') {
        return unknown;
    }
    const startFields = warsawFields(start);
    const endFields = warsawFields(end);
    if (
        !startFields ||
        !endFields ||
        end.getTime() <= start.getTime() ||
        startFields.day !== endFields.day ||
        startFields.date !== endFields.date
    ) {
        return end.getTime() > start.getTime() && startFields && endFields
            ? { status: 'outside', displayHours: 'Poza godzinami pracy' }
            : unknown;
    }
    const ranges = payload.hours?.[startFields.day];
    if (!Array.isArray(ranges)) return unknown;
    if (!ranges.every((range) =>
        range !== null &&
        typeof range === 'object' &&
        typeof range.open === 'string' &&
        typeof range.close === 'string' &&
        minuteOfDay(range.open) !== null &&
        (minuteOfDay(range.close) !== null || range.close === '24:00') &&
        (minuteOfDay(range.close) ?? (range.close === '24:00' ? 1440 : -1)) >
            (minuteOfDay(range.open) ?? 1440),
    )) return unknown;
    const displayHours = ranges.length
        ? ranges.map(({ open, close }) => `${open}–${close}`).join(', ')
        : 'Salon zamknięty';
    if (ranges.some(({ open, close }) => {
        const from = minuteOfDay(open);
        const to = close === '24:00' ? 1440 : minuteOfDay(close);
        return from !== null && to !== null && to > from &&
            startFields.minute >= from && endFields.minute <= to;
    })) {
        return { status: 'within', displayHours };
    }
    return { status: 'outside', displayHours };
}


/**
 * Existing/legacy appointment payloads may legitimately omit endTime.
 * The opening-hours guard must never invent a duration or silently allow
 * a manual reschedule/confirmation when it cannot verify the full interval.
 */
export function getPersistedAppointmentDurationMs(
    appointment:
        | { startTime: string; endTime?: string }
        | null
        | undefined,
): number | null {
    if (!appointment?.endTime) return null;
    const startMs = new Date(appointment.startTime).getTime();
    const endMs = new Date(appointment.endTime).getTime();
    const durationMs = endMs - startMs;
    if (
        !Number.isFinite(startMs) ||
        !Number.isFinite(endMs) ||
        !Number.isFinite(durationMs) ||
        durationMs <= 0
    ) return null;
    return durationMs;
}
