import { useMemo } from 'react';
import type { ReceptionFollowUpAuditResponse } from '@/types/calendar-page';
import { normalizeFollowUpAuditResponse } from '@/utils/calendarNormalize';
import { toDateParam } from '@/utils/calendarQueryState';
import {
    useReceptionFetch,
    type ApiFetchFn,
} from '@/hooks/calendar/useReceptionFetch';

export interface FollowUpAuditHook {
    loading: boolean;
    error: boolean;
    summary: ReceptionFollowUpAuditResponse | null;
}

export function useFollowUpAudit(params: {
    enabled: boolean;
    currentDate: Date;
    apiFetch: ApiFetchFn;
}): FollowUpAuditHook {
    const { enabled, currentDate, apiFetch } = params;

    const dateKey = useMemo(() => toDateParam(currentDate), [currentDate]);

    const { loading, error, data: summary } = useReceptionFetch<
        ReceptionFollowUpAuditResponse,
        ReceptionFollowUpAuditResponse | null
    >({
        enabled,
        apiFetch,
        buildUrl: () => {
            const rangeEnd = dateKey;
            const rangeStartDate = new Date(currentDate);
            rangeStartDate.setDate(rangeStartDate.getDate() - 6);
            const rangeStart = toDateParam(rangeStartDate);
            return `/crm/follow-up-actions?from=${encodeURIComponent(
                rangeStart,
            )}&to=${encodeURIComponent(rangeEnd)}`;
        },
        normalize: (raw) => normalizeFollowUpAuditResponse(raw),
        initialData: null,
        deps: [dateKey],
    });

    return { loading, error, summary };
}
