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


export type MinuteRange = { start: number; end: number };
export type UtcInterval = { start: Date; endExclusive: Date };

/**
 * Translate wall-clock working ranges into continuous real UTC intervals.
 *
 * At autumn DST fold 02:30–04:00 is NOT continuous: the first 02:30
 * is followed by the second 02:00–02:30 (outside the configured range).
 * Checking only a slot's start/end wall values would wrongly permit
 * a booking that spans that non-working interval.
 */
export function warsawAllowedUtcIntervals(
    calendarDate: string,
    ranges: MinuteRange[],
): UtcInterval[] {
    const { start, endExclusive } = warsawCalendarDayBounds(calendarDate);
    const dayStartMs = start.getTime();
    const dayEndMs = endExclusive.getTime();
    const boundaries = new Set<number>([dayStartMs, dayEndMs]);

    for (const range of ranges) {
        if (range.start < 0 || range.end > 1440 || range.end <= range.start) {
            throw new RangeError('Invalid salon working interval');
        }
        for (const wallMinute of [range.start, range.end]) {
            const moments =
                wallMinute === 1440
                    ? [endExclusive]
                    : warsawWallClockInstants(calendarDate, wallMinute);
            for (const instant of moments) {
                boundaries.add(instant.getTime());
            }
        }
    }

    // The only other points at which a wall-clock in-range predicate may
    // change are timezone-offset transitions. Probe once an hour, then
    // binary-search to minute precision when the offset changes.
    const getOffset = (ms: number) =>
        (warsawWallClockComparable(new Date(ms)) - ms) / 60_000;
    let previousSample = dayStartMs;
    let previousOffset = getOffset(previousSample);
    while (previousSample < dayEndMs) {
        const sample = Math.min(previousSample + 3_600_000, dayEndMs);
        const offset = getOffset(sample);
        if (offset !== previousOffset) {
            let low = Math.floor(previousSample / 60_000);
            let high = Math.floor(sample / 60_000);
            while (high - low > 1) {
                const mid = Math.floor((low + high) / 2);
                if (getOffset(mid * 60_000) === previousOffset) {
                    low = mid;
                } else {
                    high = mid;
                }
            }
            boundaries.add(high * 60_000);
        }
        previousSample = sample;
        previousOffset = offset;
    }

    const sorted = [...boundaries]
        .filter((ms) => ms >= dayStartMs && ms <= dayEndMs)
        .sort((a, b) => a - b);
    const base = parseCalendarDate(calendarDate);
    const allowed: UtcInterval[] = [];
    for (let i = 0; i < sorted.length - 1; i++) {
        const left = sorted[i];
        const right = sorted[i + 1];
        if (right <= left) continue;
        const midpoint = left + Math.floor((right - left) / 2);
        const wallMinute =
            (warsawWallClockComparable(new Date(midpoint)) - base) / 60_000;
        if (
            !ranges.some(
                (range) =>
                    wallMinute >= range.start && wallMinute < range.end,
            )
        ) {
            continue;
        }
        const last = allowed[allowed.length - 1];
        if (last?.endExclusive.getTime() === left) {
            last.endExclusive = new Date(right);
        } else {
            allowed.push({ start: new Date(left), endExclusive: new Date(right) });
        }
    }
    return allowed;
}
