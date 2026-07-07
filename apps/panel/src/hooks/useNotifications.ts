import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import type { Notification } from '@/types';

export function useNotifications(enabled = true) {
    const { apiFetch, isAuthenticated } = useAuth();

    return useQuery<Notification[]>({
        queryKey: ['notifications'],
        queryFn: () => apiFetch<Notification[]>('/notifications'),
        enabled: enabled && isAuthenticated,
        staleTime: 30_000,
    });
}
