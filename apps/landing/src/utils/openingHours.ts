export const DAY_KEYS = [
    'mon',
    'tue',
    'wed',
    'thu',
    'fri',
    'sat',
    'sun',
] as const;
const SCHEMA_DAYS = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
];
type Range = { readonly open: string; readonly close: string };
export type WeeklyHours = Record<string, readonly Range[]>;

export function isWeeklyHours(value: unknown): value is WeeklyHours {
    if (!value || typeof value !== 'object') return false;
    const hours = value as Record<string, unknown>;
    return DAY_KEYS.every((day) => {
        const ranges = hours[day];
        return (
            Array.isArray(ranges) &&
            ranges.every((range: unknown) => {
                if (!range || typeof range !== 'object') return false;
                const r = range as Record<string, unknown>;
                return (
                    typeof r.open === 'string' && typeof r.close === 'string'
                );
            })
        );
    });
}

/** SEO and visible hours share the same weekly schedule, including closures. */
export function openingHoursSchema(hours: WeeklyHours) {
    return DAY_KEYS.flatMap((day, index) =>
        (hours[day] ?? []).map((range) => ({
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: SCHEMA_DAYS[index],
            opens: range.open,
            closes: range.close,
        })),
    );
}
