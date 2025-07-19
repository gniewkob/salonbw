import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Employee } from '@/types';

export function useEmployeeApi() {
  const { apiFetch } = useAuth();
  const toast = useToast();

  const create = async (data: { name: string }) => {
    try {
      const res = await apiFetch<Employee>('/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      toast.success('Employee created');
      return res;
    } catch (err: any) {
      toast.error(err.message || 'Error');
      throw err;
    }
  };

  const update = async (id: number, data: { name: string }) => {
    try {
      const res = await apiFetch<Employee>(`/employees/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      toast.success('Employee updated');
      return res;
    } catch (err: any) {
      toast.error(err.message || 'Error');
      throw err;
    }
  };

  const remove = async (id: number) => {
    try {
      await apiFetch<void>(`/employees/${id}`, { method: 'DELETE' });
      toast.success('Employee deleted');
    } catch (err: any) {
      toast.error(err.message || 'Error');
      throw err;
    }
  };

  return { create, update, remove };
}
