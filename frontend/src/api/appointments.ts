import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Appointment } from '@/types';
import { trackEvent } from '@/utils/analytics';
import { APPOINTMENTS_QUERY_KEY } from '@/hooks/useAppointments';
import { useCallback } from 'react';

export function useAppointmentsApi() {
    const { apiFetch } = useAuth();
    const toast = useToast();
    const queryClient = useQueryClient();

    const invalidateAppointments = useCallback(() => {
        void queryClient.invalidateQueries({
            queryKey: APPOINTMENTS_QUERY_KEY,
        });
    }, [queryClient]);

    const handleError = useCallback(
        (err: unknown) => {
            toast.error(err instanceof Error ? err.message : 'Error');
        },
        [toast],
    );

    const createMutation = useMutation({
        mutationFn: async (data: {
            employeeId: number;
            serviceId: number;
            startTime: string;
            clientId?: number;
        }) =>
            apiFetch<Appointment>('/appointments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            }),
        onSuccess: (appt: Appointment) => {
            toast.success('Appointment created');
            invalidateAppointments();
            try {
                if (appt?.service) {
                    trackEvent('purchase', {
                        value: appt.service.price ?? 0,
                        currency: 'PLN',
                        items: [
                            {
                                item_id: appt.service.id,
                                item_name: appt.service.name,
                                item_category: appt.service.category?.name,
                            },
                        ],
                        event_source: 'appointments',
                    });
                }
            } catch {
                // ignore
            }
        },
        onError: handleError,
    });

    const updateMutation = useMutation({
        mutationFn: async (payload: {
            id: number;
            data: { startTime: string };
        }) =>
            apiFetch<Appointment>(`/appointments/${payload.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload.data),
            }),
        onSuccess: () => {
            toast.success('Appointment updated');
            invalidateAppointments();
        },
        onError: handleError,
    });

    const cancelMutation = useMutation({
        mutationFn: async (id: number) =>
            apiFetch<Appointment>(`/appointments/${id}/cancel`, {
                method: 'PATCH',
            }),
        onSuccess: () => {
            toast.success('Appointment cancelled');
            invalidateAppointments();
        },
        onError: handleError,
    });

    const completeMutation = useMutation({
        mutationFn: async (id: number) =>
            apiFetch<Appointment>(`/appointments/${id}/complete`, {
                method: 'PATCH',
            }),
        onSuccess: () => {
            toast.success('Appointment completed');
            invalidateAppointments();
        },
        onError: handleError,
    });

    return {
        create: createMutation.mutateAsync,
        update: (id: number, data: { startTime: string }) =>
            updateMutation.mutateAsync({ id, data }),
        cancel: cancelMutation.mutateAsync,
        complete: completeMutation.mutateAsync,
        mutations: {
            create: createMutation,
            update: updateMutation,
            cancel: cancelMutation,
            complete: completeMutation,
        },
    };
}
