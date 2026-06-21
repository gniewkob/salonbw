/**
 * Helpers that turn the salon's weekly opening hours (from
 * GET /calendar/opening-hours) into FullCalendar config: grid slot bounds,
 * businessHours shading, and a closed-day check. Keeps the calendar grid
 * matching Aleksandra's real schedule instead of a flat 07:00–21:00.
 */

export interface OpeningRange {
    open: string; // "HH:mm"
    close: string; // "HH:mm"
}

export type DayKey = 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat';

export type WeeklyHours = Record<DayKey, OpeningRange[]>;

export interface OpeningHoursResponse {
    source?: string;
    hours: WeeklyHours;
}

// FullCalendar uses 0=Sun..6=Sat; index this by getDay().
const DAY_KEYS: DayKey[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

function toMinutes(value: string): number {
    const [h, m] = value.split(':').map((n) => parseInt(n, 10));
    if (Number.isNaN(h) || Number.isNaN(m)) return Number.NaN;
    return h * 60 + m;
}

function pad(n: number): string {
    return String(n).padStart(2, '0');
}

/** Earliest open (floored to the hour, padded -1h, min 06:00) and latest
 *  close (ceiled to the hour, padded +1h, max 23:00) across the week. */
export function computeSlotBounds(hours: WeeklyHours): {
    slotMinTime: string;
    slotMaxTime: string;
} {
    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;
    for (const key of DAY_KEYS) {
        for (const range of hours[key] ?? []) {
            const o = toMinutes(range.open);
            const c = toMinutes(range.close);
            if (!Number.isNaN(o)) min = Math.min(min, o);
            if (!Number.isNaN(c)) max = Math.max(max, c);
        }
    }
    if (!Number.isFinite(min) || !Number.isFinite(max)) {
        return { slotMinTime: '07:00:00', slotMaxTime: '21:00:00' };
    }
    const minHour = Math.max(6, Math.floor(min / 60) - 1);
    const maxHour = Math.min(23, Math.ceil(max / 60) + 1);
    return {
        slotMinTime: `${pad(minHour)}:00:00`,
        slotMaxTime: `${pad(maxHour)}:00:00`,
    };
}

/** FullCalendar `businessHours` array (one entry per day+range). */
export function toBusinessHours(
    hours: WeeklyHours,
): Array<{ daysOfWeek: number[]; startTime: string; endTime: string }> {
    const out: Array<{
        daysOfWeek: number[];
        startTime: string;
        endTime: string;
    }> = [];
    DAY_KEYS.forEach((key, dow) => {
        for (const range of hours[key] ?? []) {
            if (range.open && range.close) {
                out.push({
                    daysOfWeek: [dow],
                    startTime: range.open,
                    endTime: range.close,
                });
            }
        }
    });
    return out;
}

/** True when the salon has no opening ranges on the given date's weekday. */
export function isDayClosed(hours: WeeklyHours, date: Date): boolean {
    const key = DAY_KEYS[date.getDay()];
    return (hours[key]?.length ?? 0) === 0;
}
