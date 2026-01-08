import { useList } from './useList';
import { Invoice } from '@/types';

export function useInvoices() {
    return useList<Invoice>('/invoices');
}
