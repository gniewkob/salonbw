'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import type {
    Supplier,
    Delivery,
    DeliveryStatus,
    Stocktaking,
    StocktakingStatus,
} from '@/types';

// ==================== SUPPLIERS ====================

export function useSuppliers(includeInactive = false) {
    const { apiFetch } = useAuth();
    const params = includeInactive ? '?includeInactive=true' : '';
    return useQuery<Supplier[]>({
        queryKey: ['suppliers', includeInactive],
        queryFn: () => apiFetch<Supplier[]>(`/suppliers${params}`),
    });
}

export function useSupplier(id: number | null) {
    const { apiFetch } = useAuth();
    return useQuery<Supplier>({
        queryKey: ['supplier', id],
        queryFn: () => apiFetch<Supplier>(`/suppliers/${id}`),
        enabled: id !== null,
    });
}

export function useCreateSupplier() {
    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Partial<Supplier>) =>
            apiFetch<Supplier>('/suppliers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            }),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['suppliers'] });
        },
    });
}

export function useUpdateSupplier() {
    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<Supplier> }) =>
            apiFetch<Supplier>(`/suppliers/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            }),
        onSuccess: (_, { id }) => {
            void queryClient.invalidateQueries({ queryKey: ['suppliers'] });
            void queryClient.invalidateQueries({ queryKey: ['supplier', id] });
        },
    });
}

export function useDeleteSupplier() {
    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) =>
            apiFetch<void>(`/suppliers/${id}`, { method: 'DELETE' }),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['suppliers'] });
        },
    });
}

// ==================== DELIVERIES ====================

export interface DeliveryFilters {
    supplierId?: number;
    status?: DeliveryStatus;
    from?: string;
    to?: string;
}

export function useDeliveries(filters?: DeliveryFilters) {
    const { apiFetch } = useAuth();
    const params = new URLSearchParams();
    if (filters?.supplierId)
        params.append('supplierId', String(filters.supplierId));
    if (filters?.status) params.append('status', filters.status);
    if (filters?.from) params.append('from', filters.from);
    if (filters?.to) params.append('to', filters.to);
    const queryStr = params.toString();

    return useQuery<Delivery[]>({
        queryKey: ['deliveries', filters],
        queryFn: () =>
            apiFetch<Delivery[]>(
                `/deliveries${queryStr ? `?${queryStr}` : ''}`,
            ),
    });
}

export function useDelivery(id: number | null) {
    const { apiFetch } = useAuth();
    return useQuery<Delivery>({
        queryKey: ['delivery', id],
        queryFn: () => apiFetch<Delivery>(`/deliveries/${id}`),
        enabled: id !== null,
    });
}

interface CreateDeliveryDto {
    supplierId?: number;
    deliveryDate?: string;
    invoiceNumber?: string;
    notes?: string;
    items?: Array<{
        productId: number;
        quantity: number;
        unitCost: number;
        batchNumber?: string;
        expiryDate?: string;
    }>;
}

export function useCreateDelivery() {
    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateDeliveryDto) =>
            apiFetch<Delivery>('/deliveries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            }),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['deliveries'] });
        },
    });
}

export function useUpdateDelivery() {
    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            id,
            data,
        }: {
            id: number;
            data: Partial<CreateDeliveryDto & { status?: DeliveryStatus }>;
        }) =>
            apiFetch<Delivery>(`/deliveries/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            }),
        onSuccess: (_, { id }) => {
            void queryClient.invalidateQueries({ queryKey: ['deliveries'] });
            void queryClient.invalidateQueries({ queryKey: ['delivery', id] });
        },
    });
}

export function useAddDeliveryItem() {
    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            deliveryId,
            item,
        }: {
            deliveryId: number;
            item: {
                productId: number;
                quantity: number;
                unitCost: number;
                batchNumber?: string;
                expiryDate?: string;
            };
        }) =>
            apiFetch(`/deliveries/${deliveryId}/items`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item),
            }),
        onSuccess: (_, { deliveryId }) => {
            void queryClient.invalidateQueries({
                queryKey: ['delivery', deliveryId],
            });
        },
    });
}

export function useRemoveDeliveryItem() {
    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            deliveryId,
            itemId,
        }: {
            deliveryId: number;
            itemId: number;
        }) =>
            apiFetch<void>(`/deliveries/${deliveryId}/items/${itemId}`, {
                method: 'DELETE',
            }),
        onSuccess: (_, { deliveryId }) => {
            void queryClient.invalidateQueries({
                queryKey: ['delivery', deliveryId],
            });
        },
    });
}

export function useReceiveDelivery() {
    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, notes }: { id: number; notes?: string }) =>
            apiFetch<Delivery>(`/deliveries/${id}/receive`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notes }),
            }),
        onSuccess: (_, { id }) => {
            void queryClient.invalidateQueries({ queryKey: ['deliveries'] });
            void queryClient.invalidateQueries({ queryKey: ['delivery', id] });
            void queryClient.invalidateQueries({ queryKey: ['products'] });
        },
    });
}

export function useCancelDelivery() {
    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) =>
            apiFetch<Delivery>(`/deliveries/${id}/cancel`, { method: 'POST' }),
        onSuccess: (_, id) => {
            void queryClient.invalidateQueries({ queryKey: ['deliveries'] });
            void queryClient.invalidateQueries({ queryKey: ['delivery', id] });
        },
    });
}

// ==================== STOCKTAKING ====================

export interface StocktakingFilters {
    status?: StocktakingStatus;
    from?: string;
    to?: string;
}

export function useStocktakings(filters?: StocktakingFilters) {
    const { apiFetch } = useAuth();
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.from) params.append('from', filters.from);
    if (filters?.to) params.append('to', filters.to);
    const queryStr = params.toString();

    return useQuery<Stocktaking[]>({
        queryKey: ['stocktakings', filters],
        queryFn: () =>
            apiFetch<Stocktaking[]>(
                `/stocktaking${queryStr ? `?${queryStr}` : ''}`,
            ),
    });
}

export function useStocktaking(id: number | null) {
    const { apiFetch } = useAuth();
    return useQuery<Stocktaking>({
        queryKey: ['stocktaking', id],
        queryFn: () => apiFetch<Stocktaking>(`/stocktaking/${id}`),
        enabled: id !== null,
    });
}

export function useCreateStocktaking() {
    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { stocktakingDate?: string; notes?: string }) =>
            apiFetch<Stocktaking>('/stocktaking', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            }),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['stocktakings'] });
        },
    });
}

export function useStartStocktaking() {
    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) =>
            apiFetch<Stocktaking>(`/stocktaking/${id}/start`, {
                method: 'POST',
            }),
        onSuccess: (_, id) => {
            void queryClient.invalidateQueries({ queryKey: ['stocktakings'] });
            void queryClient.invalidateQueries({
                queryKey: ['stocktaking', id],
            });
        },
    });
}

export function useAddStocktakingItems() {
    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            stocktakingId,
            items,
        }: {
            stocktakingId: number;
            items: Array<{
                productId: number;
                countedQuantity: number;
                notes?: string;
            }>;
        }) =>
            apiFetch<Stocktaking>(`/stocktaking/${stocktakingId}/items`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items }),
            }),
        onSuccess: (_, { stocktakingId }) => {
            void queryClient.invalidateQueries({
                queryKey: ['stocktaking', stocktakingId],
            });
        },
    });
}

export function useUpdateStocktakingItem() {
    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            stocktakingId,
            itemId,
            data,
        }: {
            stocktakingId: number;
            itemId: number;
            data: { countedQuantity?: number; notes?: string };
        }) =>
            apiFetch(`/stocktaking/${stocktakingId}/items/${itemId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            }),
        onSuccess: (_, { stocktakingId }) => {
            void queryClient.invalidateQueries({
                queryKey: ['stocktaking', stocktakingId],
            });
        },
    });
}

export function useCompleteStocktaking() {
    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            id,
            applyDifferences,
            notes,
        }: {
            id: number;
            applyDifferences?: boolean;
            notes?: string;
        }) =>
            apiFetch<Stocktaking>(`/stocktaking/${id}/complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ applyDifferences, notes }),
            }),
        onSuccess: (_, { id }) => {
            void queryClient.invalidateQueries({ queryKey: ['stocktakings'] });
            void queryClient.invalidateQueries({
                queryKey: ['stocktaking', id],
            });
            void queryClient.invalidateQueries({ queryKey: ['products'] });
        },
    });
}
