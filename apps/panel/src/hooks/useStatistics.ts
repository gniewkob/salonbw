import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import type {
    DashboardStats,
    RevenueDataPoint,
    EmployeeStats,
    ServiceStats,
    ClientStatsData,
    CashRegisterSummary,
    TipsSummary,
    DateRange,
    GroupBy,
} from '@/types';

export const STATISTICS_QUERY_KEY = ['api', '/statistics'] as const;

interface StatisticsQueryOptions {
    range?: DateRange;
    from?: string;
    to?: string;
    groupBy?: GroupBy;
    employeeId?: number;
    enabled?: boolean;
}

export function useDashboardStats() {
    const { apiFetch } = useAuth();

    const query = useQuery({
        queryKey: [...STATISTICS_QUERY_KEY, 'dashboard'],
        queryFn: async () => {
            return apiFetch<DashboardStats>('/statistics/dashboard');
        },
        refetchInterval: 60000, // Refresh every minute
    });

    return {
        data: query.data ?? null,
        error: (query.error as Error | null) ?? null,
        loading: query.isLoading,
        refetch: query.refetch,
    };
}

export function useRevenueChart(options: StatisticsQueryOptions = {}) {
    const { apiFetch } = useAuth();
    const {
        range = 'this_month',
        from,
        to,
        groupBy = 'day',
        employeeId,
        enabled = true,
    } = options;

    const queryKey = [
        ...STATISTICS_QUERY_KEY,
        'revenue',
        { range, from, to, groupBy, employeeId },
    ] as const;

    const query = useQuery({
        queryKey,
        queryFn: async () => {
            const params = new URLSearchParams();
            params.set('range', range);
            if (from) params.set('from', from);
            if (to) params.set('to', to);
            params.set('groupBy', groupBy);
            if (employeeId) params.set('employeeId', String(employeeId));
            return apiFetch<RevenueDataPoint[]>(
                `/statistics/revenue?${params.toString()}`,
            );
        },
        enabled,
    });

    return {
        data: query.data ?? [],
        error: (query.error as Error | null) ?? null,
        loading: query.isLoading,
        refetch: query.refetch,
    };
}

export function useEmployeeRanking(
    options: Omit<StatisticsQueryOptions, 'groupBy' | 'employeeId'> = {},
) {
    const { apiFetch } = useAuth();
    const { range = 'this_month', from, to, enabled = true } = options;

    const queryKey = [
        ...STATISTICS_QUERY_KEY,
        'employees',
        { range, from, to },
    ] as const;

    const query = useQuery({
        queryKey,
        queryFn: async () => {
            const params = new URLSearchParams();
            params.set('range', range);
            if (from) params.set('from', from);
            if (to) params.set('to', to);
            return apiFetch<EmployeeStats[]>(
                `/statistics/employees?${params.toString()}`,
            );
        },
        enabled,
    });

    return {
        data: query.data ?? [],
        error: (query.error as Error | null) ?? null,
        loading: query.isLoading,
        refetch: query.refetch,
    };
}

export function useServiceRanking(
    options: Omit<StatisticsQueryOptions, 'groupBy' | 'employeeId'> = {},
) {
    const { apiFetch } = useAuth();
    const { range = 'this_month', from, to, enabled = true } = options;

    const queryKey = [
        ...STATISTICS_QUERY_KEY,
        'services',
        { range, from, to },
    ] as const;

    const query = useQuery({
        queryKey,
        queryFn: async () => {
            const params = new URLSearchParams();
            params.set('range', range);
            if (from) params.set('from', from);
            if (to) params.set('to', to);
            return apiFetch<ServiceStats[]>(
                `/statistics/services?${params.toString()}`,
            );
        },
        enabled,
    });

    return {
        data: query.data ?? [],
        error: (query.error as Error | null) ?? null,
        loading: query.isLoading,
        refetch: query.refetch,
    };
}

export function useClientStats(
    options: Omit<StatisticsQueryOptions, 'groupBy' | 'employeeId'> = {},
) {
    const { apiFetch } = useAuth();
    const { range = 'this_month', from, to, enabled = true } = options;

    const queryKey = [
        ...STATISTICS_QUERY_KEY,
        'clients',
        { range, from, to },
    ] as const;

    const query = useQuery({
        queryKey,
        queryFn: async () => {
            const params = new URLSearchParams();
            params.set('range', range);
            if (from) params.set('from', from);
            if (to) params.set('to', to);
            return apiFetch<ClientStatsData>(
                `/statistics/clients?${params.toString()}`,
            );
        },
        enabled,
    });

    return {
        data: query.data ?? null,
        error: (query.error as Error | null) ?? null,
        loading: query.isLoading,
        refetch: query.refetch,
    };
}

export function useCashRegister(date?: string) {
    const { apiFetch } = useAuth();

    const queryKey = [...STATISTICS_QUERY_KEY, 'register', { date }] as const;

    const query = useQuery({
        queryKey,
        queryFn: async () => {
            const params = new URLSearchParams();
            if (date) params.set('date', date);
            const qs = params.toString();
            return apiFetch<CashRegisterSummary>(
                `/statistics/register${qs ? `?${qs}` : ''}`,
            );
        },
    });

    return {
        data: query.data ?? null,
        error: (query.error as Error | null) ?? null,
        loading: query.isLoading,
        refetch: query.refetch,
    };
}

export function useTipsRanking(
    options: Omit<StatisticsQueryOptions, 'groupBy' | 'employeeId'> = {},
) {
    const { apiFetch } = useAuth();
    const { range = 'this_month', from, to, enabled = true } = options;

    const queryKey = [
        ...STATISTICS_QUERY_KEY,
        'tips',
        { range, from, to },
    ] as const;

    const query = useQuery({
        queryKey,
        queryFn: async () => {
            const params = new URLSearchParams();
            params.set('range', range);
            if (from) params.set('from', from);
            if (to) params.set('to', to);
            return apiFetch<TipsSummary[]>(
                `/statistics/tips?${params.toString()}`,
            );
        },
        enabled,
    });

    return {
        data: query.data ?? [],
        error: (query.error as Error | null) ?? null,
        loading: query.isLoading,
        refetch: query.refetch,
    };
}
