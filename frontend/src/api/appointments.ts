import { useAuth } from '@/contexts/AuthContext';
import { Appointment } from '@/types';

export function useAppointmentsApi() {
  const { apiFetch } = useAuth();

  const create = (data: {
    clientId: number;
    employeeId: number;
    serviceId: number;
    startTime: string;
  }) =>
    apiFetch<Appointment>('/appointments/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

  const update = (id: number, data: { startTime: string }) =>
    apiFetch<Appointment>(`/appointments/admin/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

  return { create, update };
}
