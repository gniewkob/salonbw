import type { paths } from '@salonbw/api';
import type { Appointment as LocalAppointment, CalendarEvent } from '@/types';
import { useQuery } from '@tanstack/react-query';
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
    from?: string;
    to?: string;
    enabled?: boolean;
}

export function useAppointments(options: UseAppointmentsOptions = {}) {
    const { apiFetch } = useAuth();
    const { from, to, enabled = true } = options;

    const queryParams = new URLSearchParams();
    if (from) queryParams.set('from', from);
    if (to) queryParams.set('to', to);
    const queryString = queryParams.toString();
    const endpoint = `/appointments${queryString ? `?${queryString}` : ''}`;

    const query = useQuery({
        queryKey: [...APPOINTMENTS_QUERY_KEY, from, to],
        queryFn: () => apiFetch<Appointment[]>(endpoint),
        enabled,
    });

    // Transform appointments to CalendarEvents
    const calendarEvents: CalendarEvent[] =
        query.data?.map((apt) => ({
            id: apt.id,
            type: 'appointment' as const,
            title: apt.service?.name || 'Wizyta',
            startTime: apt.startTime,
            endTime: apt.endTime || apt.startTime,
            employeeId: apt.employee?.id || 0,
            employeeName: apt.employee?.name || '',
            clientId: apt.client?.id,
            clientName: apt.client?.name,
            serviceId: apt.service?.id,
            serviceName: apt.service?.name,
            status: apt.status,
        })) || [];

    return {
        data: calendarEvents,
        rawData: query.data,
        error: (query.error as Error | null) ?? null,
        loading: query.isLoading,
        isLoading: query.isLoading,
        refetch: query.refetch,
        queryKey: APPOINTMENTS_QUERY_KEY,
    };
}

export function useMyAppointments(options: UseAppointmentsOptions = {}) {
    const { apiFetch } = useAuth();
    const list = useQuery({
        queryKey: MY_APPOINTMENTS_QUERY_KEY,
        queryFn: () => apiFetch<Appointment[]>('/appointments/me'),
        enabled: options.enabled,
    });

    return {
        data: list.data ?? null,
        error: (list.error as Error | null) ?? null,
        loading: list.isLoading,
        isLoading: list.isLoading,
        refetch: list.refetch,
        queryKey: MY_APPOINTMENTS_QUERY_KEY,
    };
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
