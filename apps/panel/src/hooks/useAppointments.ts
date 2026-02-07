import type { paths } from '@salonbw/api';
import type { Appointment as LocalAppointment } from '@/types';
import { useList } from './useList';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

type AppointmentsResponse =
    paths['/appointments']['get']['responses']['200']['content']['application/json'];

type Appointment =
    AppointmentsResponse extends Array<infer Item>
        ? LocalAppointment & Item
        : LocalAppointment;

export const APPOINTMENTS_QUERY_KEY = ['api', '/appointments'] as const;
export const MY_APPOINTMENTS_QUERY_KEY = ['api', '/appointments/me'] as const;

interface UseAppointmentsOptions {
    enabled?: boolean;
}

export function useAppointments(options: UseAppointmentsOptions = {}) {
    const list = useList<Appointment>('/appointments', options);
    return { ...list, queryKey: APPOINTMENTS_QUERY_KEY };
}

export function useMyAppointments(options: UseAppointmentsOptions = {}) {
    const list = useList<Appointment>('/appointments/me', options);
    return { ...list, queryKey: MY_APPOINTMENTS_QUERY_KEY };
}

export function useAppointmentMutations() {
    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();

    const invalidateAppointments = () => {
        void queryClient.invalidateQueries({
            queryKey: APPOINTMENTS_QUERY_KEY,
        });
        void queryClient.invalidateQueries({
            queryKey: MY_APPOINTMENTS_QUERY_KEY,
        });
    };

    const cancelAppointment = useMutation({
        mutationFn: async (id: number) => {
            return apiFetch<Appointment>(`/appointments/${id}/cancel`, {
                method: 'PATCH',
            });
        },
        onSuccess: invalidateAppointments,
    });

    const completeAppointment = useMutation({
        mutationFn: async (id: number) => {
            return apiFetch<Appointment>(`/appointments/${id}/complete`, {
                method: 'PATCH',
            });
        },
        onSuccess: invalidateAppointments,
    });

    const updateAppointmentStatus = useMutation({
        mutationFn: async ({ id, status }: { id: number; status: string }) => {
            // For now, use cancel/complete endpoints. Later could add more statuses
            if (status === 'cancelled') {
                return cancelAppointment.mutateAsync(id);
            }
            if (status === 'completed') {
                return completeAppointment.mutateAsync(id);
            }
            throw new Error(`Unsupported status: ${status}`);
        },
        onSuccess: invalidateAppointments,
    });

    return {
        cancelAppointment,
        completeAppointment,
        updateAppointmentStatus,
    };
}
