import { useList } from './useList';
import { Employee, StaffOption } from '@/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

export function useEmployees() {
    return useList<Employee>('/employees');
}

export function useEmployee(id: number | null) {
    const { apiFetch } = useAuth();

    return useQuery({
        queryKey: ['employees', id],
        queryFn: () => apiFetch<Employee>(`/employees/${id}`),
        enabled: id !== null,
    });
}

export function useUpdateEmployee() {
    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            id,
            firstName,
            lastName,
        }: {
            id: number;
            firstName: string;
            lastName: string;
        }) =>
            apiFetch<Employee>(`/employees/${id}`, {
                method: 'PUT',
                body: JSON.stringify({ firstName, lastName }),
            }),
        onSuccess: (_data, { id }) => {
            void queryClient.invalidateQueries({ queryKey: ['employees'] });
            void queryClient.invalidateQueries({ queryKey: ['employees', id] });
        },
    });
}

export function useStaffOptions() {
    const { apiFetch } = useAuth();

    return useQuery({
        queryKey: ['staff-options'],
        queryFn: () => apiFetch<StaffOption[]>('/employees/staff-options'),
    });
}
