import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
    ReceptionFollowUpAction,
    ReceptionFollowUpActionState,
    ReceptionFollowUpCandidate,
} from '@/types/calendar-page';
import { normalizeFollowUpCandidatesResponse } from '@/utils/calendarNormalize';
import { toDateParam } from '@/utils/calendarQueryState';
import {
    useReceptionFetch,
    type ApiFetchFn,
} from '@/hooks/calendar/useReceptionFetch';

const EMPTY_CANDIDATES: ReceptionFollowUpCandidate[] = [];

export interface ReceptionFollowUpHook {
    loading: boolean;
    error: boolean;
    candidates: ReceptionFollowUpCandidate[];
    actionStateByKey: Record<string, ReceptionFollowUpActionState>;
    captureAction: (
        candidate: ReceptionFollowUpCandidate,
        action: ReceptionFollowUpAction,
    ) => void;
}

export function useReceptionFollowUp(params: {
    enabled: boolean;
    currentDate: Date;
    apiFetch: ApiFetchFn;
}): ReceptionFollowUpHook {
    const { enabled, currentDate, apiFetch } = params;

    const dateKey = useMemo(() => toDateParam(currentDate), [currentDate]);

    const {
        loading,
        error,
        data: candidates,
    } = useReceptionFetch<
        ReceptionFollowUpCandidate[],
        ReceptionFollowUpCandidate[]
    >({
        enabled,
        apiFetch,
        buildUrl: () =>
            `/crm/follow-up-candidates?date=${encodeURIComponent(dateKey)}`,
        normalize: normalizeFollowUpCandidatesResponse,
        initialData: EMPTY_CANDIDATES,
        deps: [dateKey],
    });

    const [actionStateByKey, setActionStateByKey] = useState<
        Record<string, ReceptionFollowUpActionState>
    >({});

    useEffect(() => {
        if (!enabled) {
            setActionStateByKey({});
        }
    }, [enabled]);

    const captureAction = useCallback(
        (
            candidate: ReceptionFollowUpCandidate,
            action: ReceptionFollowUpAction,
        ) => {
            if (candidate.appointmentId === null) return;

            const candidateKey = `${candidate.customerId}:${candidate.reason}`;
            setActionStateByKey((current) => ({
                ...current,
                [candidateKey]: { status: 'pending', action },
            }));

            void apiFetch('/crm/follow-up-actions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerId: candidate.customerId,
                    appointmentId: candidate.appointmentId,
                    candidateReason: candidate.reason,
                    action,
                    occurredAt: new Date().toISOString(),
                }),
            })
                .then(() => {
                    setActionStateByKey((current) => ({
                        ...current,
                        [candidateKey]: { status: 'success', action },
                    }));
                })
                .catch(() => {
                    setActionStateByKey((current) => ({
                        ...current,
                        [candidateKey]: {
                            status: 'error',
                            action,
                            message: 'Nie udało się zapisać akcji follow-up.',
                        },
                    }));
                });
        },
        [apiFetch],
    );

    return {
        loading,
        error,
        candidates,
        actionStateByKey,
        captureAction,
    };
}
