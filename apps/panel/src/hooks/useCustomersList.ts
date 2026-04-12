import { useList } from './useList';
import { Client } from '@/types';

export function useCustomersList() {
    return useList<Client>('/customers');
}
