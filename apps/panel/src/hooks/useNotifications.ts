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

export function useActionableNotificationCount() {
    const { apiFetch, role } = useAuth();
    const isStaff =
        role === 'admin' || role === 'receptionist' || role === 'employee';
    const query = useQuery({
        queryKey: ['actionable-notification-count'],
        queryFn: () =>
            apiFetch<{ count: number }>('/notifications/actionable-count'),
        enabled: isStaff,
        refetchInterval: 2 * 60 * 1000,
        staleTime: 90 * 1000,
    });

    return query.data?.count ?? 0;
}
