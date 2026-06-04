import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Employee, StaffRole } from '@/types';

export function useEmployeeApi() {
    const { apiFetch } = useAuth();
    const toast = useToast();

    const create = async (data: {
        firstName: string;
        lastName: string;
        email?: string;
        role?: StaffRole;
    }) => {
        try {
            const res = await apiFetch<Employee>('/employees', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            toast.success('Employee created');
            return res;
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Error');
            throw err;
        }
    };

    const update = async (
        id: number,
        data: { firstName: string; lastName: string },
    ) => {
        try {
            const res = await apiFetch<Employee>(`/employees/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            toast.success('Employee updated');
            return res;
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Error');
            throw err;
        }
    };

    const updateRole = async (id: number, role: StaffRole) => {
        try {
            const res = await apiFetch<Employee>(`/employees/${id}/role`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role }),
            });
            toast.success('Rola zaktualizowana');
            return res;
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Error');
            throw err;
        }
    };

    const remove = async (id: number) => {
        try {
            await apiFetch(`/employees/${id}`, { method: 'DELETE' });
            toast.success('Employee deleted');
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Error');
            throw err;
        }
    };

    return { create, update, updateRole, remove };
}
