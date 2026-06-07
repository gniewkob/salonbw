import { useAuth } from '@/contexts/AuthContext';
import { Client } from '@/types';

export function useCustomerApi() {
    const { apiFetch } = useAuth();

    const create = async (data: { name: string }) => {
        return apiFetch<Client>('/customers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
    };

    const update = async (id: number, data: { name: string }) => {
        return apiFetch<Client>(`/customers/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
    };

    const remove = async (id: number) => {
        await apiFetch(`/customers/${id}`, { method: 'DELETE' });
    };

    return { create, update, remove };
}
