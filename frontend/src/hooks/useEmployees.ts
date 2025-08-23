import { useList } from './useList';
import { Employee } from '@/types';

export function useEmployees() {
    return useList<Employee>('/employees');
}
