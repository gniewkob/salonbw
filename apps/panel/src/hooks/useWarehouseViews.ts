import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import type {
    ProductCardView,
    ProductCategory,
    ProductCommissionRule,
    ProductExtended,
    ProductHistoryItem,
    WarehouseOrder,
    WarehouseSale,
    WarehouseUsage,
} from '@/types';

interface ProductQuery {
    search?: string;
    categoryId?: number;
    includeInactive?: boolean;
}

interface StocktakingHistoryRow {
    id: number;
    stocktakingNumber: string;
    status: 'draft' | 'in_progress' | 'completed' | 'cancelled';
    stocktakingDate: string;
    productsCount: number;
    shortageCount: number;
    overageCount: number;
    matchedCount: number;
}

function toQueryString(
    params: Record<string, string | number | boolean | undefined>,
) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') return;
        query.set(key, String(value));
    });
    const encoded = query.toString();
    return encoded ? `?${encoded}` : '';
}

export function useWarehouseProducts(filters: ProductQuery) {
    const { apiFetch } = useAuth();
    return useQuery<ProductExtended[]>({
        queryKey: ['warehouse-products', filters],
        staleTime: 30_000,
        queryFn: () =>
            apiFetch<ProductExtended[]>(
                `/products${toQueryString({
                    search: filters.search,
                    categoryId: filters.categoryId,
                    includeInactive: filters.includeInactive,
                })}`,
            ),
    });
}

export function useProductCategories() {
    const { apiFetch } = useAuth();
    return useQuery<ProductCategory[]>({
        queryKey: ['product-categories-tree'],
        staleTime: 5 * 60_000,
        queryFn: () => apiFetch<ProductCategory[]>('/product-categories/tree'),
    });
}

export function useCreateProductCategory() {
    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: {
            name: string;
            parentId?: number;
            sortOrder?: number;
            isActive?: boolean;
        }) =>
            apiFetch<ProductCategory>('/product-categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            }),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: ['product-categories-tree'],
            });
            void queryClient.invalidateQueries({
                queryKey: ['warehouse-products'],
            });
        },
    });
}

export function useUpdateProductCategory() {
    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            id,
            payload,
        }: {
            id: number;
            payload: {
                name?: string;
                parentId?: number;
                sortOrder?: number;
                isActive?: boolean;
            };
        }) =>
            apiFetch<ProductCategory>(`/product-categories/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            }),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: ['product-categories-tree'],
            });
            void queryClient.invalidateQueries({
                queryKey: ['warehouse-products'],
            });
        },
    });
}

export function useDeleteProductCategory() {
    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) =>
            apiFetch(`/product-categories/${id}`, { method: 'DELETE' }),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: ['product-categories-tree'],
            });
            void queryClient.invalidateQueries({
                queryKey: ['warehouse-products'],
            });
        },
    });
}

export function useProductCard(productId?: number) {
    const { apiFetch } = useAuth();
    return useQuery<ProductCardView>({
        queryKey: ['product-card', productId],
        enabled: Boolean(productId),
        queryFn: () => apiFetch<ProductCardView>(`/products/${productId}/card`),
    });
}

export function useProductHistory(productId?: number) {
    const { apiFetch } = useAuth();
    return useQuery<ProductHistoryItem[]>({
        queryKey: ['product-history', productId],
        enabled: Boolean(productId),
        queryFn: () =>
            apiFetch<ProductHistoryItem[]>(`/products/${productId}/history`),
    });
}

export function useProductFormulas(productId?: number) {
    const { apiFetch } = useAuth();
    return useQuery<
        Array<{
            id: number;
            serviceId: number;
            serviceName: string | null;
            serviceVariantId: number | null;
            serviceVariantName: string | null;
            quantity: number;
            unit: string | null;
            notes: string | null;
            createdAt: string;
        }>
    >({
        queryKey: ['product-formulas', productId],
        enabled: Boolean(productId),
        queryFn: () =>
            apiFetch<
                Array<{
                    id: number;
                    serviceId: number;
                    serviceName: string | null;
                    serviceVariantId: number | null;
                    serviceVariantName: string | null;
                    quantity: number;
                    unit: string | null;
                    notes: string | null;
                    createdAt: string;
                }>
            >(`/products/${productId}/formulas`),
    });
}

export function useProductCommissions(productId?: number) {
    const { apiFetch } = useAuth();
    return useQuery<ProductCommissionRule[]>({
        queryKey: ['product-commissions', productId],
        enabled: Boolean(productId),
        queryFn: () =>
            apiFetch<ProductCommissionRule[]>(
                `/products/${productId}/commissions`,
            ),
    });
}

export function useUpdateProductCommissions(productId?: number) {
    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (rules: ProductCommissionRule[]) =>
            apiFetch<ProductCommissionRule[]>(
                `/products/${productId}/commissions`,
                {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        rules: rules.map((rule) => ({
                            employeeId: rule.employeeId,
                            commissionPercent: Number(
                                rule.commissionPercent ?? 0,
                            ),
                        })),
                    }),
                },
            ),
        onSuccess: () => {
            if (!productId) return;
            void queryClient.invalidateQueries({
                queryKey: ['product-commissions', productId],
            });
        },
    });
}

export function useWarehouseSales() {
    const { apiFetch } = useAuth();
    return useQuery<WarehouseSale[]>({
        queryKey: ['warehouse-sales'],
        queryFn: () => apiFetch<WarehouseSale[]>('/sales'),
    });
}

export function useWarehouseSale(saleId?: number) {
    const { apiFetch } = useAuth();
    return useQuery<WarehouseSale>({
        queryKey: ['warehouse-sale', saleId],
        enabled: Boolean(saleId),
        queryFn: () => apiFetch<WarehouseSale>(`/sales/${saleId}`),
    });
}

export function useCreateWarehouseSale() {
    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: {
            soldAt?: string;
            clientName?: string;
            employeeId?: number;
            paymentMethod?: string;
            note?: string;
            items: Array<{
                productId: number;
                quantity: number;
                unit?: string;
                unitPrice?: number;
                discount?: number;
            }>;
        }) =>
            apiFetch<WarehouseSale>('/sales', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            }),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: ['warehouse-sales'],
            });
            void queryClient.invalidateQueries({
                queryKey: ['warehouse-products'],
            });
        },
    });
}

export function useWarehouseUsage(
    scope: 'all' | 'planned' | 'completed' = 'all',
) {
    const { apiFetch } = useAuth();
    return useQuery<WarehouseUsage[]>({
        queryKey: ['warehouse-usage', scope],
        queryFn: () =>
            apiFetch<WarehouseUsage[]>(
                `/usage${scope === 'all' ? '' : `?scope=${scope}`}`,
            ),
    });
}

export function useWarehouseUsageEntry(usageId?: number) {
    const { apiFetch } = useAuth();
    return useQuery<WarehouseUsage>({
        queryKey: ['warehouse-usage-entry', usageId],
        enabled: Boolean(usageId),
        queryFn: () => apiFetch<WarehouseUsage>(`/usage/${usageId}`),
    });
}

export function useCreateWarehouseUsage() {
    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: {
            clientName?: string;
            employeeId?: number;
            appointmentId?: number;
            note?: string;
            scope?: 'planned' | 'completed';
            plannedFor?: string;
            items: Array<{
                productId: number;
                quantity: number;
                unit?: string;
            }>;
        }) =>
            apiFetch<WarehouseUsage>('/usage', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            }),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: ['warehouse-usage'],
            });
            void queryClient.invalidateQueries({
                queryKey: ['warehouse-products'],
            });
        },
    });
}

export function useWarehouseOrders(enabled = true) {
    const { apiFetch } = useAuth();
    return useQuery<WarehouseOrder[]>({
        queryKey: ['warehouse-orders'],
        queryFn: () => apiFetch<WarehouseOrder[]>('/orders'),
        enabled,
    });
}

export function useWarehouseOrder(orderId?: number) {
    const { apiFetch } = useAuth();
    return useQuery<WarehouseOrder>({
        queryKey: ['warehouse-order', orderId],
        enabled: Boolean(orderId),
        queryFn: () => apiFetch<WarehouseOrder>(`/orders/${orderId}`),
    });
}

export function useCreateWarehouseOrder() {
    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: {
            supplierId?: number;
            notes?: string;
            items: Array<{
                productId?: number;
                productName?: string;
                quantity: number;
                unit?: string;
            }>;
        }) =>
            apiFetch<WarehouseOrder>('/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            }),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: ['warehouse-orders'],
            });
        },
    });
}

function useOrderAction(
    action: 'send' | 'cancel' | 'receive',
    payload?: Record<string, unknown>,
) {
    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (orderId: number) =>
            apiFetch<WarehouseOrder>(`/orders/${orderId}/${action}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload ?? {}),
            }),
        onSuccess: (_, orderId) => {
            void queryClient.invalidateQueries({
                queryKey: ['warehouse-orders'],
            });
            void queryClient.invalidateQueries({
                queryKey: ['warehouse-order', orderId],
            });
            void queryClient.invalidateQueries({
                queryKey: ['warehouse-products'],
            });
        },
    });
}

export function useSendWarehouseOrder() {
    return useOrderAction('send');
}

export function useCancelWarehouseOrder() {
    return useOrderAction('cancel');
}

export function useReceiveWarehouseOrder() {
    return useOrderAction('receive');
}

export function useStocktakingHistory(
    status?: 'draft' | 'in_progress' | 'completed' | 'cancelled',
) {
    const { apiFetch } = useAuth();
    return useQuery<StocktakingHistoryRow[]>({
        queryKey: ['stocktaking-history', status ?? 'all'],
        queryFn: () =>
            apiFetch<StocktakingHistoryRow[]>(
                `/stocktaking/history${status ? `?status=${status}` : ''}`,
            ),
    });
}
