import { useAuth } from '@/contexts/AuthContext';
import { Employee, StaffRole } from '@/types';

export function useEmployeeApi() {
    const { apiFetch } = useAuth();

    const create = async (data: {
        firstName: string;
        lastName: string;
        email?: string;
        role?: StaffRole;
    }) => {
        return apiFetch<Employee>('/employees', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
    };

    const update = async (
        id: number,
        data: { firstName: string; lastName: string },
    ) => {
        return apiFetch<Employee>(`/employees/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
    };

    const updateRole = async (id: number, role: StaffRole) => {
        return apiFetch<Employee>(`/employees/${id}/role`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role }),
        });
    };

    const remove = async (id: number) => {
        await apiFetch(`/employees/${id}`, { method: 'DELETE' });
    };

    return { create, update, updateRole, remove };
}
