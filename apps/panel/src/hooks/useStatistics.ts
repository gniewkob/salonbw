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
    CommissionReportSummary,
} from '@/types';

// ==================== Employee Activity ====================

export interface EmployeeActivity {
    employeeId: number;
    employeeName: string;
    workTimeMinutes: number;
    appointmentsCount: number;
}

export interface EmployeeActivitySummary {
    date: string;
    employees: EmployeeActivity[];
    totals: {
        workTimeMinutes: number;
        appointmentsCount: number;
    };
}

export function useEmployeeActivity(date?: string) {
    const { apiFetch } = useAuth();
    const queryDate = date || new Date().toISOString().split('T')[0];

    return useQuery<EmployeeActivitySummary>({
        queryKey: ['statistics', 'employees', 'activity', queryDate],
        queryFn: () =>
            apiFetch<EmployeeActivitySummary>(
                `/statistics/employees/activity?date=${queryDate}`,
            ),
    });
}

// ==================== Dashboard ====================

export function useDashboardStats() {
    const { apiFetch } = useAuth();
    return useQuery<DashboardStats>({
        queryKey: ['statistics', 'dashboard'],
        queryFn: () => apiFetch<DashboardStats>('/statistics/dashboard'),
        refetchInterval: 60000,
    });
}

// ==================== Employee Ranking ====================

export interface EmployeeRankingParams {
    range?: 'today' | 'this_week' | 'this_month' | 'last_month' | 'custom';
    from?: string;
    to?: string;
    enabled?: boolean;
}

export function useEmployeeRanking(params: EmployeeRankingParams = {}) {
    const { apiFetch } = useAuth();
    const { range = 'this_month', from, to, enabled = true } = params;

    const queryParams = new URLSearchParams();
    queryParams.set('range', range);
    if (from) queryParams.set('from', from);
    if (to) queryParams.set('to', to);

    return useQuery<EmployeeStats[]>({
        queryKey: ['statistics', 'employees', 'ranking', params],
        queryFn: () =>
            apiFetch<EmployeeStats[]>(
                `/statistics/employees?${queryParams.toString()}`,
            ),
        enabled,
    });
}

// ==================== Service Ranking ====================

export function useServiceRanking(params: EmployeeRankingParams = {}) {
    const { apiFetch } = useAuth();
    const { range = 'this_month', from, to, enabled = true } = params;

    const queryParams = new URLSearchParams();
    queryParams.set('range', range);
    if (from) queryParams.set('from', from);
    if (to) queryParams.set('to', to);

    return useQuery<ServiceStats[]>({
        queryKey: ['statistics', 'services', 'ranking', params],
        queryFn: () =>
            apiFetch<ServiceStats[]>(
                `/statistics/services?${queryParams.toString()}`,
            ),
        enabled,
    });
}

// ==================== Client Stats ====================

export function useClientStats(params: EmployeeRankingParams = {}) {
    const { apiFetch } = useAuth();
    const { range = 'this_month', from, to, enabled = true } = params;

    const queryParams = new URLSearchParams();
    queryParams.set('range', range);
    if (from) queryParams.set('from', from);
    if (to) queryParams.set('to', to);

    return useQuery<ClientStatsData>({
        queryKey: ['statistics', 'clients', params],
        queryFn: () =>
            apiFetch<ClientStatsData>(
                `/statistics/clients?${queryParams.toString()}`,
            ),
        enabled,
    });
}

// ==================== Cash Register ====================

export function useCashRegister(date?: string) {
    const { apiFetch } = useAuth();
    const queryDate = date || new Date().toISOString().split('T')[0];

    return useQuery<CashRegisterSummary>({
        queryKey: ['statistics', 'register', queryDate],
        queryFn: () =>
            apiFetch<CashRegisterSummary>(
                `/statistics/register?date=${queryDate}`,
            ),
    });
}

// ==================== Tips ====================

export function useTipsSummary(params: EmployeeRankingParams = {}) {
    const { apiFetch } = useAuth();
    const { range = 'this_month', from, to } = params;

    const queryParams = new URLSearchParams();
    queryParams.set('range', range);
    if (from) queryParams.set('from', from);
    if (to) queryParams.set('to', to);

    return useQuery<TipsSummary[]>({
        queryKey: ['statistics', 'tips', params],
        queryFn: () =>
            apiFetch<TipsSummary[]>(
                `/statistics/tips?${queryParams.toString()}`,
            ),
    });
}

// ==================== Commission Report ====================

export function useCommissionReport(params: EmployeeRankingParams = {}) {
    const { apiFetch } = useAuth();
    const { range = 'today', from, to } = params;

    const queryParams = new URLSearchParams();
    queryParams.set('range', range);
    if (from) queryParams.set('from', from);
    if (to) queryParams.set('to', to);

    return useQuery<CommissionReportSummary>({
        queryKey: ['statistics', 'commissions', params],
        queryFn: () =>
            apiFetch<CommissionReportSummary>(
                `/statistics/commissions?${queryParams.toString()}`,
            ),
    });
}

// ==================== Revenue Chart ====================

export interface RevenueChartParams {
    range?: 'today' | 'this_week' | 'this_month' | 'last_month' | 'custom';
    from?: string;
    to?: string;
    groupBy?: 'day' | 'week' | 'month';
    employeeId?: number;
}

export function useRevenueChart(params: RevenueChartParams = {}) {
    const { apiFetch } = useAuth();
    const {
        range = 'this_month',
        from,
        to,
        groupBy = 'day',
        employeeId,
    } = params;

    const queryParams = new URLSearchParams();
    queryParams.set('range', range);
    queryParams.set('groupBy', groupBy);
    if (from) queryParams.set('from', from);
    if (to) queryParams.set('to', to);
    if (employeeId) queryParams.set('employeeId', String(employeeId));

    return useQuery<RevenueDataPoint[]>({
        queryKey: ['statistics', 'revenue', params],
        queryFn: () =>
            apiFetch<RevenueDataPoint[]>(
                `/statistics/revenue?${queryParams.toString()}`,
            ),
    });
}
