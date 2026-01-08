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

export function useAppointments() {
    const list = useList<Appointment>('/appointments');
    return { ...list, queryKey: APPOINTMENTS_QUERY_KEY };
}
