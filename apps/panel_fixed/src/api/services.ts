import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Service } from '@/types';

export function useServiceApi() {
    const { apiFetch } = useAuth();
    const toast = useToast();

    const create = async (data: { name: string }) => {
        try {
            const res = await apiFetch<Service>('/services', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            toast.success('Service created');
            return res;
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Error');
            throw err;
        }
    };

    const update = async (id: number, data: { name: string }) => {
        try {
            const res = await apiFetch<Service>(`/services/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            toast.success('Service updated');
            return res;
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Error');
            throw err;
        }
    };

    const remove = async (id: number) => {
        try {
            await apiFetch(`/services/${id}`, { method: 'DELETE' });
            toast.success('Service deleted');
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Error');
            throw err;
        }
    };

    return { create, update, remove };
}
