import { useEffect, useMemo, useState } from 'react';
import { BUSINESS_INFO } from '@/config/content';
import { useLanguage } from '@/contexts/LanguageContext';
import {
    DAY_KEYS,
    isWeeklyHours,
    openingHoursSchema,
    type WeeklyHours,
} from '@/utils/openingHours';

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || 'https://api.salon-bw.pl';

type Range = { readonly open: string; readonly close: string };

export interface OpeningHoursLine {
    label: string;
    value: string;
    closed?: boolean;
}

function formatRanges(ranges: readonly Range[], closedLabel: string): string {
    if (!ranges.length) return closedLabel;
    return ranges.map((r) => `${r.open} - ${r.close}`).join(', ');
}

/**
 * Groups consecutive days with identical hours into display lines
 * ("Pn–Pt 10:00 - 19:00"). Include every day so closures and Sunday
 * openings always come from the schedule, never a separate fixed label.
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
    return lines;
}

/**
 * Salon opening hours for display and SEO. Starts with the server's schedule
 * (or the configured fallback) and swaps to live hours from
 * the public /calendar/opening-hours endpoint, which follows the
 * owner-employee's timetable. On any fetch problem the static hours
 * simply stay.
 */
export function useOpeningHours(initialHours?: WeeklyHours | null) {
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
                if (!cancelled && isWeeklyHours(data?.hours))
                    setLive(data.hours);
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
        // Live hours when available, otherwise the static weekly fallback —
        // both go through buildLines so the no-JS / pre-hydration render shows
        // the real per-day schedule (incl. Wed closed), matching live exactly.
        const source = live ?? initialHours ?? BUSINESS_INFO.weeklyHours;
        return buildLines(source, T.hours.dayShort, T.hours.closed);
    }, [live, initialHours, T]);

    const schedule = live ?? initialHours;
    return {
        lines,
        specification: schedule ? openingHoursSchema(schedule) : undefined,
    };
}
