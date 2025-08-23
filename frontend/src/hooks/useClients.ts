import { useList } from './useList';
import { Client } from '@/types';

export function useClients() {
    return useList<Client>('/clients');
}
