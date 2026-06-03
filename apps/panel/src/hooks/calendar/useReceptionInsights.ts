import { useMemo } from 'react';
import type {
    ReceptionOperationalInsightsByActionItem,
    ReceptionOperationalInsightsByDayItem,
    ReceptionOperationalInsightsResponse,
} from '@/types/calendar-page';
import { normalizeOperationalInsightsResponse } from '@/utils/calendarNormalize';
import { toDateParam } from '@/utils/calendarQueryState';
import {
    useReceptionFetch,
    type ApiFetchFn,
} from '@/hooks/calendar/useReceptionFetch';

export interface ReceptionInsightsSummary {
    actionsTotal: number;
    actionsOnAlerts: number;
    alertActionRate: number;
}

export interface ReceptionInsightsHook {
    loading: boolean;
    error: boolean;
    summary: ReceptionInsightsSummary | null;
    byAction: ReceptionOperationalInsightsByActionItem[];
    byDay: ReceptionOperationalInsightsByDayItem[];
}

interface InsightsData {
    summary: ReceptionInsightsSummary | null;
    byAction: ReceptionOperationalInsightsByActionItem[];
    byDay: ReceptionOperationalInsightsByDayItem[];
}

const INITIAL_DATA: InsightsData = {
    summary: null,
    byAction: [],
    byDay: [],
};

export function useReceptionInsights(params: {
    enabled: boolean;
    currentDate: Date;
    apiFetch: ApiFetchFn;
}): ReceptionInsightsHook {
    const { enabled, currentDate, apiFetch } = params;

    const dateKey = useMemo(() => toDateParam(currentDate), [currentDate]);

    const { loading, error, data } = useReceptionFetch<
        ReceptionOperationalInsightsResponse,
        InsightsData
    >({
        enabled,
        apiFetch,
        buildUrl: () => {
            const rangeEnd = dateKey;
            const rangeStartDate = new Date(currentDate);
            rangeStartDate.setDate(rangeStartDate.getDate() - 6);
            const rangeStart = toDateParam(rangeStartDate);
            return `/reception/operational-insights?from=${encodeURIComponent(
                rangeStart,
            )}&to=${encodeURIComponent(rangeEnd)}`;
        },
        normalize: (raw) => {
            const normalized = normalizeOperationalInsightsResponse(raw);
            return {
                summary: normalized.summary,
                byAction: normalized.byAction,
                byDay: normalized.byDay,
            };
        },
        initialData: INITIAL_DATA,
        deps: [dateKey],
    });

    return {
        loading,
        error,
        summary: data.summary,
        byAction: data.byAction,
        byDay: data.byDay,
    };
}
