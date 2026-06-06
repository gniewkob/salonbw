import { useAuth } from '@/contexts/AuthContext';
import { Service } from '@/types';

export function useServiceApi() {
    const { apiFetch } = useAuth();

    const create = async (data: { name: string }) => {
        return apiFetch<Service>('/services', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
    };

    const update = async (id: number, data: { name: string }) => {
        return apiFetch<Service>(`/services/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
    };

    const remove = async (id: number) => {
        await apiFetch(`/services/${id}`, { method: 'DELETE' });
    };

    return { create, update, remove };
}
