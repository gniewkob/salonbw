import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Client } from '@/types';

export function useClientApi() {
  const { apiFetch } = useAuth();
  const toast = useToast();

  const create = async (data: { name: string }) => {
    try {
      const res = await apiFetch<Client>('/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      toast.success('Client created');
      return res;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error');
      throw err;
    }
  };

  const update = async (id: number, data: { name: string }) => {
    try {
      const res = await apiFetch<Client>(`/clients/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      toast.success('Client updated');
      return res;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error');
      throw err;
    }
  };

  const remove = async (id: number) => {
    try {
      await apiFetch<void>(`/clients/${id}`, { method: 'DELETE' });
      toast.success('Client deleted');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error');
      throw err;
    }
  };

  return { create, update, remove };
}
