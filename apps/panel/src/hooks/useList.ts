import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

const listQueryKey = (endpoint: string) => ['api', endpoint] as const;

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

interface UseListOptions {
    enabled?: boolean;
    page?: number;
    limit?: number;
}

export function useList<T>(endpoint: string, options: UseListOptions = {}) {
    const { apiFetch } = useAuth();
    const { enabled = true, page, limit } = options;

    const queryParams = new URLSearchParams();
    if (page !== undefined) queryParams.set('page', page.toString());
    if (limit !== undefined) queryParams.set('limit', limit.toString());
    const queryString = queryParams.toString();
    const finalEndpoint = `${endpoint}${queryString ? (endpoint.includes('?') ? '&' : '?') + queryString : ''}`;

    const query = useQuery({
        queryKey: [...listQueryKey(endpoint), page, limit],
        queryFn: () => apiFetch<PaginatedResponse<T>>(finalEndpoint),
        enabled,
    });

    return {
        data: query.data?.data ?? null,
        total: query.data?.total ?? 0,
        page: query.data?.page ?? 1,
        limit: query.data?.limit ?? 50,
        totalPages: query.data?.totalPages ?? 1,
        error: (query.error as Error | null) ?? null,
        loading: query.isLoading,
        refetch: query.refetch,
        queryKey: listQueryKey(endpoint),
    };
}
