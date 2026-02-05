import type { paths } from '@salonbw/api';
import type { Service as LocalService, ServiceCategory } from '@/types';
import { useList } from './useList';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

type ServicesResponse =
    paths['/services']['get']['responses']['200']['content']['application/json'];
type Service =
    ServicesResponse extends Array<infer Item>
        ? LocalService & Item
        : LocalService;

export function useServices() {
    return useList<Service>('/services');
}

export function useServiceCategories() {
    const { apiFetch } = useAuth();
    return useQuery<ServiceCategory[]>({
        queryKey: ['service-categories'],
        queryFn: () => apiFetch<ServiceCategory[]>('/service-categories'),
    });
}
