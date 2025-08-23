import { useList } from './useList';
import { Appointment } from '@/types';

export function useAppointments() {
    return useList<Appointment>('/appointments');
}
