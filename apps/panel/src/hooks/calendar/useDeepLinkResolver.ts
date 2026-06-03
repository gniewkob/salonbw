import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import type { Appointment } from '@/types';
import type { ApiFetchFn } from '@/hooks/calendar/useReceptionFetch';

export interface DeepLinkResolverHook {
    error: string | null;
    clearLink: () => void;
}

export function useDeepLinkResolver(params: {
    appointmentsById: Map<number, Appointment>;
    apiFetch: ApiFetchFn;
    onResolved: (appointment: Appointment) => void;
}): DeepLinkResolverHook {
    const { appointmentsById, apiFetch, onResolved } = params;

    const router = useRouter();
    const handledIdRef = useRef<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const appointmentIdParam = Array.isArray(router.query.appointmentId)
            ? router.query.appointmentId[0]
            : router.query.appointmentId;
        if (!appointmentIdParam) {
            handledIdRef.current = null;
            setError(null);
            return;
        }

        const appointmentId = Number(appointmentIdParam);
        if (!Number.isFinite(appointmentId) || appointmentId <= 0) return;
        if (handledIdRef.current === appointmentId) return;

        const appointmentFromCalendar = appointmentsById.get(appointmentId);
        if (appointmentFromCalendar) {
            setError(null);
            onResolved(appointmentFromCalendar);
            handledIdRef.current = appointmentId;
            return;
        }

        let cancelled = false;

        void apiFetch<Appointment>(`/appointments/${appointmentId}`)
            .then((appointment) => {
                if (cancelled) return;
                setError(null);
                onResolved(appointment);
                handledIdRef.current = appointmentId;
            })
            .catch(() => {
                if (cancelled) return;
                console.warn('[calendar] deep-link fetch failed', {
                    appointmentId,
                });
                setError(
                    'Nie udało się otworzyć wizyty z linku. Spróbuj ponownie.',
                );
            });

        return () => {
            cancelled = true;
        };
    }, [router.query.appointmentId, appointmentsById, apiFetch, onResolved]);

    const clearLink = useCallback(() => {
        const query = { ...router.query } as Record<string, string>;
        delete query.appointmentId;
        void router.push({ pathname: router.pathname, query }, undefined, {
            shallow: true,
        });
    }, [router]);

    return { error, clearLink };
}
