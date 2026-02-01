import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import type {
    StockAlertsResponse,
    LowStockProduct,
    ReorderSuggestion,
    StockSummary,
    ProductType,
} from '@/types';

export const STOCK_ALERTS_QUERY_KEY = ['api', '/stock-alerts'] as const;

interface UseStockAlertsOptions {
    productType?: ProductType;
    trackStockOnly?: boolean;
    limit?: number;
    enabled?: boolean;
}

export function useStockAlerts(options: UseStockAlertsOptions = {}) {
    const { apiFetch } = useAuth();
    const {
        productType,
        trackStockOnly = true,
        limit,
        enabled = true,
    } = options;

    const params = new URLSearchParams();
    if (productType) params.append('productType', productType);
    if (trackStockOnly !== undefined)
        params.append('trackStockOnly', String(trackStockOnly));
    if (limit) params.append('limit', String(limit));

    const queryString = params.toString();
    const endpoint = `/stock-alerts${queryString ? `?${queryString}` : ''}`;

    return useQuery({
        queryKey: [...STOCK_ALERTS_QUERY_KEY, options],
        queryFn: async () => {
            return apiFetch<StockAlertsResponse>(endpoint);
        },
        enabled,
        staleTime: 30_000, // 30 seconds
        refetchInterval: 60_000, // 1 minute auto-refresh
    });
}

export function useLowStockProducts(options: UseStockAlertsOptions = {}) {
    const { apiFetch } = useAuth();
    const {
        productType,
        trackStockOnly = true,
        limit,
        enabled = true,
    } = options;

    const params = new URLSearchParams();
    if (productType) params.append('productType', productType);
    if (trackStockOnly !== undefined)
        params.append('trackStockOnly', String(trackStockOnly));
    if (limit) params.append('limit', String(limit));

    const queryString = params.toString();
    const endpoint = `/stock-alerts/low-stock${queryString ? `?${queryString}` : ''}`;

    return useQuery({
        queryKey: [...STOCK_ALERTS_QUERY_KEY, 'low-stock', options],
        queryFn: async () => {
            return apiFetch<LowStockProduct[]>(endpoint);
        },
        enabled,
    });
}

export function useCriticalStockProducts(enabled = true) {
    const { apiFetch } = useAuth();

    return useQuery({
        queryKey: [...STOCK_ALERTS_QUERY_KEY, 'critical'],
        queryFn: async () => {
            return apiFetch<LowStockProduct[]>('/stock-alerts/critical');
        },
        enabled,
        refetchInterval: 30_000, // 30 seconds auto-refresh for critical items
    });
}

export function useStockSummary(enabled = true) {
    const { apiFetch } = useAuth();

    return useQuery({
        queryKey: [...STOCK_ALERTS_QUERY_KEY, 'summary'],
        queryFn: async () => {
            return apiFetch<StockSummary>('/stock-alerts/summary');
        },
        enabled,
        staleTime: 60_000, // 1 minute
    });
}

export function useSupplierReorderSuggestions(
    supplierId: number | null,
    enabled = true,
) {
    const { apiFetch } = useAuth();

    return useQuery({
        queryKey: [
            ...STOCK_ALERTS_QUERY_KEY,
            'suppliers',
            supplierId,
            'reorder',
        ],
        queryFn: async () => {
            return apiFetch<ReorderSuggestion[]>(
                `/stock-alerts/suppliers/${supplierId}/reorder`,
            );
        },
        enabled: enabled && supplierId !== null,
    });
}
