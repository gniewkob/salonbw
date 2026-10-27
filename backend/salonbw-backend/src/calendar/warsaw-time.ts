/**
 * Convert salon calendar wall-clock minutes into UTC instants.
 *
 * Do not construct dates with `new Date('YYYY-MM-DDT09:00')`:
 * the result depends on the Node server's TZ (often UTC in CI).
 * Europe/Warsaw also has 23/25-hour days, a nonexistent spring hour
 * and an ambiguous repeated autumn hour.
 *
 * No global TZ mutation and no dependency on the server's local zone.
 */
const WARSAW_ZONE = 'Europe/Warsaw';
const FORMATTER = new Intl.DateTimeFormat('en-GB', {
    timeZone: WARSAW_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
});

type WallParts = {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
};

function wallParts(instant: Date): WallParts {
    const record: Record<string, number> = {};
    for (const part of FORMATTER.formatToParts(instant)) {
        if (part.type !== 'literal') {
            record[part.type] = Number(part.value);
        }
    }
    return {
        year: record.year,
        month: record.month,
        day: record.day,
        hour: record.hour,
        minute: record.minute,
    };
}

function toNaiveUtcMilliseconds(parts: WallParts): number {
    return Date.UTC(
        parts.year,
        parts.month - 1,
        parts.day,
        parts.hour,
        parts.minute,
    );
}

function parseCalendarDate(date: string): number {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        throw new RangeError('Invalid salon calendar date');
    }
    const base = Date.parse(`${date}T00:00:00.000Z`);
    if (!Number.isFinite(base) || new Date(base).toISOString().slice(0, 10) !== date) {
        throw new RangeError('Invalid salon calendar date');
    }
    return base;
}

/** All real instants for a local wall-clock time; 0 in the DST gap, 2 in the fold. */
export function warsawWallClockInstants(
    calendarDate: string,
    minuteOfDay: number,
): Date[] {
    if (!Number.isInteger(minuteOfDay) || minuteOfDay < 0 || minuteOfDay >= 1440) {
        throw new RangeError('Invalid salon wall-clock minute');
    }
    const naive = parseCalendarDate(calendarDate) + minuteOfDay * 60_000;
    // Probe both sides of possible offset transitions. Offsets come from Intl
    // time-zone rules, not a hard-coded CET/CEST assumption.
    const offsets = new Set<number>();
    for (const sample of [naive - 36 * 3_600_000, naive, naive + 36 * 3_600_000]) {
        const parts = wallParts(new Date(sample));
        offsets.add(toNaiveUtcMilliseconds(parts) - sample);
    }
    const matches: number[] = [];
    for (const offset of offsets) {
        const candidate = naive - offset;
        if (toNaiveUtcMilliseconds(wallParts(new Date(candidate))) === naive) {
            matches.push(candidate);
        }
    }
    return [...new Set(matches)]
        .sort((a, b) => a - b)
        .map((milliseconds) => new Date(milliseconds));
}

/** Exclusive end: correctly spans 23 or 25 hours on DST switch dates. */
export function warsawCalendarDayBounds(date: string): {
    start: Date;
    endExclusive: Date;
} {
    const midnight = warsawWallClockInstants(date, 0)[0];
    const nextDate = new Date(parseCalendarDate(date) + 86_400_000)
        .toISOString()
        .slice(0, 10);
    const nextMidnight = warsawWallClockInstants(nextDate, 0)[0];
    if (!midnight || !nextMidnight) {
        throw new RangeError('Cannot determine salon day bounds');
    }
    return { start: midnight, endExclusive: nextMidnight };
}

/** Wall-clock epoch for bounds comparison, not an actual instant. */
export function warsawWallClockComparable(instant: Date): number {
    return toNaiveUtcMilliseconds(wallParts(instant));
}
