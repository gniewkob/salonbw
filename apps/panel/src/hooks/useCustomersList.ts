import { useList } from './useList';
import { Customer } from '@/types';

export function useCustomersList(page?: number, limit?: number) {
    return useList<Customer>('/customers', { page, limit });
}
