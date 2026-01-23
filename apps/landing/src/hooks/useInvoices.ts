import { useList } from './useList';
import { Invoice } from '@/types';

interface UseInvoicesOptions {
    enabled?: boolean;
}

export function useInvoices(options: UseInvoicesOptions = {}) {
    return useList<Invoice>('/invoices', options);
}

export function useMyInvoices(options: UseInvoicesOptions = {}) {
    return useList<Invoice>('/invoices/me', options);
}
