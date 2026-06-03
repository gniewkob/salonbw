import { useCallback, useEffect, useState } from 'react';
import type {
    CancellationRequestActionState,
    CancellationRequestQueueItem,
} from '@/types/calendar-page';
import { normalizeCancellationRequestsResponse } from '@/utils/calendarNormalize';
import type { ApiFetchFn } from '@/hooks/calendar/useReceptionFetch';

export interface CancellationRequestsHook {
    loading: boolean;
    error: boolean;
    requests: CancellationRequestQueueItem[];
    actionStateByAppointmentId: Record<number, CancellationRequestActionState>;
    cancelRequest: (appointmentId: number) => void;
}

export function useCancellationRequests(params: {
    enabled: boolean;
    apiFetch: ApiFetchFn;
    onAfterCancel?: () => void;
}): CancellationRequestsHook {
    const { enabled, apiFetch, onAfterCancel } = params;

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [requests, setRequests] = useState<CancellationRequestQueueItem[]>(
        [],
    );
    const [actionStateByAppointmentId, setActionStateByAppointmentId] =
        useState<Record<number, CancellationRequestActionState>>({});

    useEffect(() => {
        if (!enabled) {
            setLoading(false);
            setError(false);
            setRequests([]);
            setActionStateByAppointmentId({});
            return;
        }

        let cancelled = false;
        setLoading(true);
        setError(false);

        void apiFetch<CancellationRequestQueueItem[]>(
            '/appointments/cancellation-requests?limit=50',
        )
            .then((response) => {
                if (cancelled) return;
                setRequests(normalizeCancellationRequestsResponse(response));
                setError(false);
            })
            .catch(() => {
                if (cancelled) return;
                setRequests([]);
                setError(true);
            })
            .finally(() => {
                if (cancelled) return;
                setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [enabled, apiFetch]);

    const cancelRequest = useCallback(
        (appointmentId: number) => {
            setActionStateByAppointmentId((current) => ({
                ...current,
                [appointmentId]: { status: 'pending' },
            }));

            void apiFetch(`/appointments/${appointmentId}/cancel`, {
                method: 'PATCH',
            })
                .then(() => {
                    setRequests((current) =>
                        current.filter(
                            (request) =>
                                request.appointmentId !== appointmentId,
                        ),
                    );
                    setActionStateByAppointmentId((current) => ({
                        ...current,
                        [appointmentId]: {
                            status: 'success',
                            message: 'Wizyta została anulowana.',
                        },
                    }));
                    onAfterCancel?.();
                })
                .catch(() => {
                    setActionStateByAppointmentId((current) => ({
                        ...current,
                        [appointmentId]: {
                            status: 'error',
                            message:
                                'Nie udało się anulować wizyty. Spróbuj ponownie.',
                        },
                    }));
                });
        },
        [apiFetch, onAfterCancel],
    );

    return {
        loading,
        error,
        requests,
        actionStateByAppointmentId,
        cancelRequest,
    };
}
