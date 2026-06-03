import { useCallback, useEffect, useState } from 'react';
import type { ReceptionOperationalSummaryResponse } from '@/types/calendar-page';
import { toDateParam } from '@/utils/calendarQueryState';
import type { ApiFetchFn } from '@/hooks/calendar/useReceptionFetch';

export interface ActionsAccountingHook {
    runtimeOnAlertsCount: number;
    persistedOnAlertsCount: number | null;
    persistedTotalCount: number | null;
    incrementRuntime: () => void;
}

export function useActionsAccounting(params: {
    enabled: boolean;
    currentDate: Date;
    selectedEmployeeIds: number[];
    apiFetch: ApiFetchFn;
}): ActionsAccountingHook {
    const { enabled, currentDate, selectedEmployeeIds, apiFetch } = params;

    const [runtimeOnAlertsCount, setRuntimeOnAlertsCount] = useState(0);
    const [persistedOnAlertsCount, setPersistedOnAlertsCount] = useState<
        number | null
    >(null);
    const [persistedTotalCount, setPersistedTotalCount] = useState<
        number | null
    >(null);

    // Runtime counter resets on view / date / employee filter change so each
    // session of "reception time" starts from zero.
    useEffect(() => {
        setRuntimeOnAlertsCount(0);
    }, [currentDate, enabled, selectedEmployeeIds]);

    // Persisted counts are the backend snapshot for the current date.
    useEffect(() => {
        if (!enabled) {
            setPersistedOnAlertsCount(null);
            setPersistedTotalCount(null);
            return;
        }

        const date = toDateParam(currentDate);
        let cancelled = false;

        void apiFetch<ReceptionOperationalSummaryResponse>(
            `/reception/operational-summary?date=${encodeURIComponent(date)}`,
        )
            .then((summary) => {
                if (cancelled) return;
                setPersistedTotalCount(summary.actionsTotal ?? 0);
                setPersistedOnAlertsCount(summary.actionsOnAlerts ?? 0);
            })
            .catch(() => {
                if (cancelled) return;
                setPersistedTotalCount(null);
                setPersistedOnAlertsCount(null);
            });

        return () => {
            cancelled = true;
        };
    }, [apiFetch, currentDate, enabled]);

    const incrementRuntime = useCallback(() => {
        setRuntimeOnAlertsCount((current) => current + 1);
    }, []);

    return {
        runtimeOnAlertsCount,
        persistedOnAlertsCount,
        persistedTotalCount,
        incrementRuntime,
    };
}
