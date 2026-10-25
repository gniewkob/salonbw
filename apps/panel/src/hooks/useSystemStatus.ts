import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

export interface SystemStatus {
    checkedAt: string;
    status: 'ok' | 'degraded';
    api: { status: 'ok'; uptimeSeconds: number; revision: string | null };
    services: Record<
        string,
        { status: 'ok' | 'error' | 'skipped'; latencyMs: number }
    >;
    notifications: { deliveryVerification: 'unknown' };
}

export function useSystemStatus() {
    const { apiFetch, user } = useAuth();
    return useQuery<SystemStatus>({
        queryKey: ['system-status', user?.id],
        enabled: user?.role === 'admin' && user.isSystemAdmin === true,
        queryFn: ({ signal }) =>
            apiFetch<SystemStatus>('/system/status', { signal }),
        refetchInterval: 60_000,
        refetchOnWindowFocus: false,
        retry: false,
    });
}
