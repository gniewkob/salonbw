import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Customer } from '@/types';

export function useCustomerApi() {
    const { apiFetch } = useAuth();
    const toast = useToast();

    const create = async (data: { name: string }) => {
        try {
            const res = await apiFetch<Customer>('/customers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            toast.success('Customer created');
            return res;
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Error');
            throw err;
        }
    };

    const update = async (id: number, data: { name: string }) => {
        try {
            const res = await apiFetch<Customer>(`/customers/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            toast.success('Customer updated');
            return res;
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Error');
            throw err;
        }
    };

    const remove = async (id: number) => {
        try {
            await apiFetch(`/customers/${id}`, { method: 'DELETE' });
            toast.success('Customer deleted');
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Error');
            throw err;
        }
    };

    return { create, update, remove };
}
