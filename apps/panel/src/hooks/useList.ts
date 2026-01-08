import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

const listQueryKey = (endpoint: string) => ['api', endpoint] as const;

export function useList<T>(endpoint: string) {
    const { apiFetch } = useAuth();
    const query = useQuery({
        queryKey: listQueryKey(endpoint),
        queryFn: () => apiFetch<T[]>(endpoint),
    });

    return {
        data: query.data ?? null,
        error: (query.error as Error | null) ?? null,
        loading: query.isLoading,
        refetch: query.refetch,
        queryKey: listQueryKey(endpoint),
    };
}
