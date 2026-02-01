import type { paths } from '@salonbw/api';
import type { Appointment as LocalAppointment } from '@/types';
import { useList } from './useList';

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
