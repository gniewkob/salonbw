import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Appointment } from '@/types';

export function useAppointmentsApi() {
    const { apiFetch } = useAuth();
    const toast = useToast();

    const create = async (data: {
        employeeId: number;
        serviceId: number;
        startTime: string;
        clientId?: number;
    }) => {
        try {
            const res = await apiFetch<Appointment>('/appointments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            toast.success('Appointment created');
            return res;
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Error');
            throw err;
        }
    };

    const update = async (id: number, data: { startTime: string }) => {
        try {
            const res = await apiFetch<Appointment>(`/appointments/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            toast.success('Appointment updated');
            return res;
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Error');
            throw err;
        }
    };

    return { create, update };
}
