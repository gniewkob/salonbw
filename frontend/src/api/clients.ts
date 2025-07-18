import { useAuth } from '@/contexts/AuthContext';
import { Client } from '@/types';

export function useClientApi() {
  const { apiFetch } = useAuth();

  const create = (data: { name: string }) =>
    apiFetch<Client>('/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

  const update = (id: number, data: { name: string }) =>
    apiFetch<Client>(`/clients/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

  const remove = (id: number) =>
    apiFetch<void>(`/clients/${id}`, { method: 'DELETE' });

  return { create, update, remove };
}
