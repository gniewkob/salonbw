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


type TimeGridEvent = {
    startTime: string;
    endTime: string;
    allDay?: boolean;
};

type SlotBounds = {
    slotMinTime: string;
    slotMaxTime: string;
};

/**
 * FullCalendar treats slotMaxTime as an EXCLUSIVE grid boundary. A staff-
 * approved appointment outside weekly opening hours must remain visible in
 * the day/week grid, even though its time is shaded as non-business hours.
 *
 * Only expand the displayed hours for events intersecting the selected
 * day/week. Do not modify businessHours or booking permissions. All times
 * follow FullCalendar's local browser timezone; dates are stepped by local
 * calendar days so DST transitions cannot shift the visible week.
 */
export function expandSlotBoundsForVisibleEvents(
    baseline: SlotBounds,
    events: readonly TimeGridEvent[],
    selectedDate: Date,
    view: 'day' | 'week' | 'month',
): SlotBounds {
    if (view === 'month' || !Number.isFinite(selectedDate.getTime())) {
        return baseline;
    }

    let minHour = Number(baseline.slotMinTime.slice(0, 2));
    let maxHour = Number(baseline.slotMaxTime.slice(0, 2));
    if (
        !Number.isInteger(minHour) ||
        !Number.isInteger(maxHour) ||
        minHour < 0 ||
        maxHour > 24 ||
        minHour >= maxHour
    ) {
        return baseline;
    }

    const mondayOffset = view === 'week'
        ? (selectedDate.getDay() + 6) % 7
        : 0;
    const firstDay = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate() - mondayOffset,
    );
    const totalDays = view === 'week' ? 7 : 1;

    for (let offset = 0; offset < totalDays; offset += 1) {
        const dayStart = new Date(
            firstDay.getFullYear(),
            firstDay.getMonth(),
            firstDay.getDate() + offset,
        ).getTime();
        const dayEnd = new Date(
            firstDay.getFullYear(),
            firstDay.getMonth(),
            firstDay.getDate() + offset + 1,
        ).getTime();

        for (const event of events) {
            if (event.allDay) continue;
            const start = new Date(event.startTime).getTime();
            const end = new Date(event.endTime).getTime();
            if (
                !Number.isFinite(start) ||
                !Number.isFinite(end) ||
                end <= start ||
                start >= dayEnd ||
                end <= dayStart
            ) continue;

            const visibleStart = Math.max(start, dayStart);
            const visibleEnd = Math.min(end, dayEnd);
            const startDate = new Date(visibleStart);
            const endDate = new Date(visibleEnd);
            const startMinutes = visibleStart === dayStart
                ? 0
                : startDate.getHours() * 60 + startDate.getMinutes();
            // An interval ending at local midnight still occupies the last
            // slot of the preceding day (24:00), not a 00:00 end slot.
            const endMinutes = visibleEnd === dayEnd
                ? 1440
                : endDate.getHours() * 60 + endDate.getMinutes() +
                    (endDate.getSeconds() > 0 ? 1 : 0);

            if (Math.floor(startMinutes / 60) < minHour) {
                minHour = Math.max(0, Math.floor(startMinutes / 60) - 1);
            }
            if (Math.ceil(endMinutes / 60) > maxHour) {
                maxHour = Math.min(24, Math.ceil(endMinutes / 60) + 1);
            }
        }
    }

    return {
        slotMinTime: `${pad(minHour)}:00:00`,
        slotMaxTime: `${pad(maxHour)}:00:00`,
    };
}
