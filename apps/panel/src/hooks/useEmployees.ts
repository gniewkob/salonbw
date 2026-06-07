import { useList } from './useList';
import { Employee, StaffOption } from '@/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';

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
    const toast = useToast();

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
            toast.success('Dane pracownika zapisane');
        },
        onError: () => {
            toast.error('Nie udało się zapisać danych pracownika');
        },
    });
}

export function useEmployeeCommissionBase(id: number | null) {
    const { apiFetch } = useAuth();

    return useQuery({
        queryKey: ['employee-commission-base', id],
        queryFn: () =>
            apiFetch<{ commissionBase: number }>(
                `/employees/${id}/commission-base`,
            ),
        enabled: id !== null,
    });
}

export function useUpdateEmployeeCommissionBase() {
    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: ({
            id,
            commissionBase,
        }: {
            id: number;
            commissionBase: number;
        }) =>
            apiFetch<{ commissionBase: number }>(
                `/employees/${id}/commission-base`,
                {
                    method: 'PATCH',
                    body: JSON.stringify({ commissionBase }),
                },
            ),
        onSuccess: (_data, { id }) => {
            void queryClient.invalidateQueries({
                queryKey: ['employee-commission-base', id],
            });
            toast.success('Prowizja pracownika zapisana');
        },
        onError: () => {
            toast.error('Nie udało się zapisać prowizji');
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
