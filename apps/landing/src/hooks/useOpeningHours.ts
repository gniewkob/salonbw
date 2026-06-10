import { useEffect, useMemo, useState } from 'react';
import { BUSINESS_INFO } from '@/config/content';
import { useLanguage } from '@/contexts/LanguageContext';

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || 'https://api.salon-bw.pl';

const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

type Range = { open: string; close: string };
type WeeklyHours = Record<string, Range[]>;

export interface OpeningHoursLine {
    label: string;
    value: string;
    closed?: boolean;
}

function formatRanges(ranges: Range[], closedLabel: string): string {
    if (!ranges.length) return closedLabel;
    return ranges.map((r) => `${r.open} - ${r.close}`).join(', ');
}

/**
 * Groups consecutive days with identical hours into display lines
 * ("Pn–Pt 10:00 - 19:00"). Trailing closed days (typically Sunday)
 * are dropped to match the salon's established display style.
 */
function buildLines(
    hours: WeeklyHours,
    dayShort: readonly string[],
    closedLabel: string,
): OpeningHoursLine[] {
    const values = DAY_KEYS.map((k) =>
        formatRanges(hours[k] ?? [], closedLabel),
    );
    const lines: OpeningHoursLine[] = [];
    let start = 0;
    for (let i = 1; i <= DAY_KEYS.length; i++) {
        if (i === DAY_KEYS.length || values[i] !== values[start]) {
            const label =
                i - 1 === start
                    ? dayShort[start]
                    : `${dayShort[start]}–${dayShort[i - 1]}`;
            lines.push({
                label,
                value: values[start],
                closed: values[start] === closedLabel,
            });
            start = i;
        }
    }
    while (lines.length > 1 && lines[lines.length - 1].closed) {
        lines.pop();
    }
    return lines;
}

/**
 * Salon opening hours for display. Starts with the static configured
 * hours (instant render, no layout shift) and swaps to live hours from
 * the public /calendar/opening-hours endpoint, which follows the
 * owner-employee's timetable. On any fetch problem the static hours
 * simply stay.
 */
export function useOpeningHours(): { lines: OpeningHoursLine[] } {
    const { T } = useLanguage();
    const [live, setLive] = useState<WeeklyHours | null>(null);

    useEffect(() => {
        let cancelled = false;
        const controller = new AbortController();
        fetch(`${API_BASE_URL}/calendar/opening-hours`, {
            signal: controller.signal,
        })
            .then((res) => (res.ok ? res.json() : null))
            .then((data: { hours?: WeeklyHours } | null) => {
                if (!cancelled && data?.hours) setLive(data.hours);
            })
            .catch(() => {
                // static fallback stays
            });
        return () => {
            cancelled = true;
            controller.abort();
        };
    }, []);

    const lines = useMemo(() => {
        if (live) {
            const built = buildLines(live, T.hours.dayShort, T.hours.closed);
            if (built.length > 0 && built.some((l) => !l.closed)) {
                return built;
            }
        }
        return [
            {
                label: T.hours.mondayFriday,
                value: BUSINESS_INFO.hours.mondayFriday,
            },
            { label: T.hours.saturday, value: BUSINESS_INFO.hours.saturday },
        ];
    }, [live, T]);

    return { lines };
}
