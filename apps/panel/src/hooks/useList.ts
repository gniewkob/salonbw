import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

const listQueryKey = (endpoint: string) => ['api', endpoint] as const;

interface UseListOptions {
    enabled?: boolean;
}

export function useList<T>(endpoint: string, options: UseListOptions = {}) {
    const { apiFetch } = useAuth();
    const { enabled = true } = options;
    const query = useQuery({
        queryKey: listQueryKey(endpoint),
        queryFn: () => apiFetch<T[]>(endpoint),
        enabled,
    });

    return {
        data: query.data ?? null,
        error: (query.error as Error | null) ?? null,
        loading: query.isLoading,
        refetch: query.refetch,
        queryKey: listQueryKey(endpoint),
    };
}
