import {
    SyntheticScheduleSummary,
    SyntheticTimetableExceptionRecord,
    SyntheticTimetableRecord,
    SyntheticWorkingDay,
    SyntheticWorkingRange,
} from './synthetic-data.types';

export const SYNTHETIC_PAST_DAYS = 35;
export const SYNTHETIC_FUTURE_DAYS = 60;

const SALON_TIME_ZONE = 'Europe/Warsaw';
const CLOSED_EXCEPTION_TYPES = new Set([
    'day_off',
    'holiday',
    'vacation',
    'sick_leave',
    'training',
    'other',
]);
const VALID_EXCEPTION_TYPES = new Set([
    ...CLOSED_EXCEPTION_TYPES,
    'custom_hours',
]);
const WARSAW_FORMATTER = new Intl.DateTimeFormat('en-GB', {
    timeZone: SALON_TIME_ZONE,
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
});
const ISO_WEEKDAY_INDEX: Record<string, number> = {
    Mon: 0,
    Tue: 1,
    Wed: 2,
    Thu: 3,
    Fri: 4,
    Sat: 5,
    Sun: 6,
};

interface WarsawParts {
    weekday: number;
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
}

interface NormalizedTimetable extends SyntheticTimetableRecord {
    validFromKey: string;
    validToKey: string | null;
}

interface NormalizedException extends SyntheticTimetableExceptionRecord {
    dateKey: string;
}

function scheduleError(code: string): Error {
    return new Error(`SYNTHETIC_SCHEDULE_${code}`);
}

function formatWarsawParts(value: Date): WarsawParts {
    const raw = Object.fromEntries(
        WARSAW_FORMATTER.formatToParts(value)
            .filter((part) => part.type !== 'literal')
            .map((part) => [part.type, part.value]),
    );
    const weekday = ISO_WEEKDAY_INDEX[raw.weekday];

    if (
        weekday === undefined ||
        !raw.year ||
        !raw.month ||
        !raw.day ||
        !raw.hour ||
        !raw.minute
    ) {
        throw scheduleError('WARSAW_FORMAT_INVALID');
    }

    return {
        weekday,
        year: Number(raw.year),
        month: Number(raw.month),
        day: Number(raw.day),
        hour: Number(raw.hour),
        minute: Number(raw.minute),
    };
}

export function warsawDateKey(value: Date): string {
    if (Number.isNaN(value.getTime())) {
        throw scheduleError('DATE_INVALID');
    }
    const parts = formatWarsawParts(value);
    return `${parts.year.toString().padStart(4, '0')}-${parts.month
        .toString()
        .padStart(2, '0')}-${parts.day.toString().padStart(2, '0')}`;
}

export function warsawMinuteOfDay(value: Date): number {
    if (Number.isNaN(value.getTime())) {
        throw scheduleError('DATE_INVALID');
    }
    const parts = formatWarsawParts(value);
    return parts.hour * 60 + parts.minute;
}

function parseDateKey(value: string | Date): string {
    if (value instanceof Date) return warsawDateKey(value);

    const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (dateOnly) {
        const parsed = new Date(`${value}T00:00:00.000Z`);
        if (
            Number.isNaN(parsed.getTime()) ||
            parsed.toISOString().slice(0, 10) !== value
        ) {
            throw scheduleError('DATE_INVALID');
        }
        return value;
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) throw scheduleError('DATE_INVALID');
    return warsawDateKey(parsed);
}

function parseTime(value: string, errorCode = 'TIME_INVALID'): number {
    const match = /^(?:([01]\d|2[0-3]):([0-5]\d))(?::[0-5]\d)?$/.exec(value);
    if (!match) throw scheduleError(errorCode);
    return Number(match[1]) * 60 + Number(match[2]);
}

function assertSlot(slot: SyntheticTimetableRecord['slots'][number]): void {
    if (
        !Number.isInteger(slot.dayOfWeek) ||
        slot.dayOfWeek < 0 ||
        slot.dayOfWeek > 6
    ) {
        throw scheduleError('DAY_OF_WEEK_INVALID');
    }
    const start = parseTime(slot.startTime);
    const end = parseTime(slot.endTime);
    if (end <= start) throw scheduleError('RANGE_INVALID');
}

function normalizeTimetables(
    timetables: SyntheticTimetableRecord[],
): NormalizedTimetable[] {
    return timetables.map((timetable) => {
        timetable.slots.forEach(assertSlot);
        const validFromKey = parseDateKey(timetable.validFrom);
        const validToKey = timetable.validTo
            ? parseDateKey(timetable.validTo)
            : null;
        if (validToKey && validToKey < validFromKey) {
            throw scheduleError('VALIDITY_INVALID');
        }
        return { ...timetable, validFromKey, validToKey };
    });
}

function normalizeExceptions(
    exceptions: SyntheticTimetableExceptionRecord[],
): NormalizedException[] {
    return exceptions.map((exception) => {
        if (!VALID_EXCEPTION_TYPES.has(exception.type)) {
            throw scheduleError('EXCEPTION_TYPE_INVALID');
        }
        if (exception.type === 'custom_hours') {
            try {
                if (!exception.customStartTime || !exception.customEndTime) {
                    throw scheduleError('CUSTOM_HOURS_INVALID');
                }
                const start = parseTime(
                    exception.customStartTime,
                    'CUSTOM_HOURS_INVALID',
                );
                const end = parseTime(
                    exception.customEndTime,
                    'CUSTOM_HOURS_INVALID',
                );
                if (end <= start) throw scheduleError('CUSTOM_HOURS_INVALID');
            } catch (error) {
                if (
                    error instanceof Error &&
                    error.message === 'SYNTHETIC_SCHEDULE_CUSTOM_HOURS_INVALID'
                ) {
                    throw error;
                }
                throw scheduleError('CUSTOM_HOURS_INVALID');
            }
        }
        return { ...exception, dateKey: parseDateKey(exception.date) };
    });
}

function dateKeyAtOffset(date: string, offset: number): string {
    const [year, month, day] = date.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day + offset))
        .toISOString()
        .slice(0, 10);
}

function minuteRangesForSlots(
    timetable: NormalizedTimetable,
    weekday: number,
    isBreak: boolean,
): SyntheticWorkingRange[] {
    return timetable.slots
        .filter(
            (slot) => slot.dayOfWeek === weekday && slot.isBreak === isBreak,
        )
        .map((slot) => ({
            startMinute: parseTime(slot.startTime),
            endMinute: parseTime(slot.endTime),
        }));
}

function mergeRanges(ranges: SyntheticWorkingRange[]): SyntheticWorkingRange[] {
    const merged: SyntheticWorkingRange[] = [];
    for (const range of [...ranges].sort(
        (a, b) => a.startMinute - b.startMinute || a.endMinute - b.endMinute,
    )) {
        const previous = merged.at(-1);
        if (previous && range.startMinute <= previous.endMinute) {
            previous.endMinute = Math.max(previous.endMinute, range.endMinute);
        } else {
            merged.push({ ...range });
        }
    }
    return merged;
}

function subtractRange(
    ranges: SyntheticWorkingRange[],
    breakRange: SyntheticWorkingRange,
): SyntheticWorkingRange[] {
    return ranges.flatMap((range) => {
        if (
            breakRange.endMinute <= range.startMinute ||
            breakRange.startMinute >= range.endMinute
        ) {
            return [range];
        }
        const remaining: SyntheticWorkingRange[] = [];
        if (breakRange.startMinute > range.startMinute) {
            remaining.push({
                startMinute: range.startMinute,
                endMinute: breakRange.startMinute,
            });
        }
        if (breakRange.endMinute < range.endMinute) {
            remaining.push({
                startMinute: breakRange.endMinute,
                endMinute: range.endMinute,
            });
        }
        return remaining;
    });
}

export function warsawDateAtMinute(date: string, minute: number): Date {
    if (!Number.isInteger(minute) || minute < 0 || minute >= 24 * 60) {
        throw scheduleError('MINUTE_INVALID');
    }
    const dateKey = parseDateKey(date);
    const [year, month, day] = dateKey.split('-').map(Number);
    const hour = Math.floor(minute / 60);
    const minutePart = minute % 60;
    const targetWallTime = Date.UTC(year, month - 1, day, hour, minutePart);
    let guess = new Date(targetWallTime);

    for (let attempt = 0; attempt < 4; attempt += 1) {
        const parts = formatWarsawParts(guess);
        const formattedWallTime = Date.UTC(
            parts.year,
            parts.month - 1,
            parts.day,
            parts.hour,
            parts.minute,
        );
        const correction = targetWallTime - formattedWallTime;
        if (correction === 0) return guess;
        guess = new Date(guess.getTime() + correction);
    }

    throw scheduleError('WARSAW_TIME_INVALID');
}

export function resolveSyntheticWorkingDays(input: {
    anchorDate: Date;
    timetables: SyntheticTimetableRecord[];
    exceptions: SyntheticTimetableExceptionRecord[];
}): SyntheticWorkingDay[] {
    const timetables = normalizeTimetables(input.timetables);
    const exceptions = normalizeExceptions(input.exceptions);
    const anchorDateKey = warsawDateKey(input.anchorDate);
    const days: SyntheticWorkingDay[] = [];

    for (
        let offset = -SYNTHETIC_PAST_DAYS;
        offset <= SYNTHETIC_FUTURE_DAYS;
        offset += 1
    ) {
        const date = dateKeyAtOffset(anchorDateKey, offset);
        const applicable = timetables
            .filter(
                (timetable) =>
                    timetable.validFromKey <= date &&
                    (!timetable.validToKey || timetable.validToKey >= date),
            )
            .sort(
                (a, b) =>
                    b.validFromKey.localeCompare(a.validFromKey) || b.id - a.id,
            )[0];
        if (!applicable) throw scheduleError(`MISSING:${date}`);

        const exception = exceptions.filter(
            (item) =>
                item.timetableId === applicable.id && item.dateKey === date,
        );
        if (exception.length > 1) {
            throw scheduleError('EXCEPTION_AMBIGUOUS');
        }
        if (exception[0]) {
            if (CLOSED_EXCEPTION_TYPES.has(exception[0].type)) {
                days.push({ date, ranges: [] });
                continue;
            }
            const startMinute = parseTime(
                exception[0].customStartTime as string,
                'CUSTOM_HOURS_INVALID',
            );
            const endMinute = parseTime(
                exception[0].customEndTime as string,
                'CUSTOM_HOURS_INVALID',
            );
            days.push({ date, ranges: [{ startMinute, endMinute }] });
            continue;
        }

        const weekday = formatWarsawParts(
            warsawDateAtMinute(date, 12 * 60),
        ).weekday;
        const working = mergeRanges(
            minuteRangesForSlots(applicable, weekday, false),
        );
        const ranges = mergeRanges(
            mergeRanges(minuteRangesForSlots(applicable, weekday, true)).reduce(
                (remaining, breakRange) => subtractRange(remaining, breakRange),
                working,
            ),
        );
        days.push({ date, ranges });
    }

    return days;
}

export function summarizeSyntheticSchedule(
    days: SyntheticWorkingDay[],
): Omit<SyntheticScheduleSummary, 'convertedInProgress'> {
    if (days.length === 0) throw scheduleError('SUMMARY_EMPTY');
    const workingDays = days.filter((day) => day.ranges.length > 0).length;
    return {
        rangeStart: days[0].date,
        rangeEnd: days.at(-1)!.date,
        workingDays,
        closedDays: days.length - workingDays,
    };
}
