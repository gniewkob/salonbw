import { useList } from './useList';
import { Employee, StaffOption } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

export function useEmployees() {
    return useList<Employee>('/employees');
}

export function useStaffOptions() {
    const { apiFetch } = useAuth();

    return useQuery({
        queryKey: ['staff-options'],
        queryFn: () => apiFetch<StaffOption[]>('/employees/staff-options'),
    });
}
