'use client';

import {
    useQuery,
    useMutation,
    useQueryClient,
    keepPreviousData,
} from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
    Customer,
    CustomerGroup,
    CustomerNote,
    CustomerTag,
    CustomerStatistics,
    CustomerEventHistory,
    CustomerFilterParams,
    PaginatedCustomers,
    NoteType,
} from '@/types';

// ==================== CUSTOMERS ====================

export function useCustomers(filters: CustomerFilterParams = {}) {
    const { apiFetch } = useAuth();
    const queryString = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
            queryString.set(key, String(value));
        }
    });

    return useQuery<PaginatedCustomers>({
        queryKey: ['customers', filters],
        queryFn: () =>
            apiFetch<PaginatedCustomers>(
                `/customers?${queryString.toString()}`,
            ),
        placeholderData: keepPreviousData,
    });
}

export function useCustomer(id: number | null) {
    const { apiFetch } = useAuth();
    return useQuery<Customer>({
        queryKey: ['customer', id],
        queryFn: () => apiFetch<Customer>(`/customers/${id}`),
        enabled: id !== null,
    });
}

export function useCreateCustomer() {
    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: Partial<Customer>) =>
            apiFetch<Customer>('/customers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            }),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['customers'] });
        },
    });
}

export function useUpdateCustomer() {
    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<Customer> }) =>
            apiFetch<Customer>(`/customers/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            }),
        onSuccess: (_, variables) => {
            void queryClient.invalidateQueries({ queryKey: ['customers'] });
            void queryClient.invalidateQueries({
                queryKey: ['customer', variables.id],
            });
        },
    });
}

// ==================== STATISTICS ====================

export function useCustomerStatistics(customerId: number | null) {
    const { apiFetch } = useAuth();
    return useQuery<CustomerStatistics>({
        queryKey: ['customer-statistics', customerId],
        queryFn: () =>
            apiFetch<CustomerStatistics>(`/customers/${customerId}/statistics`),
        enabled: customerId !== null,
    });
}

export function useCustomerEventHistory(
    customerId: number | null,
    options?: { limit?: number; offset?: number },
) {
    const { apiFetch } = useAuth();
    return useQuery<CustomerEventHistory>({
        queryKey: ['customer-events', customerId, options],
        queryFn: () => {
            const params = new URLSearchParams();
            if (options?.limit) params.set('limit', String(options.limit));
            if (options?.offset) params.set('offset', String(options.offset));
            const queryStr = params.toString();
            return apiFetch<CustomerEventHistory>(
                `/customers/${customerId}/events-history${queryStr ? `?${queryStr}` : ''}`,
            );
        },
        enabled: customerId !== null,
    });
}

// ==================== NOTES ====================

export function useCustomerNotes(customerId: number | null) {
    const { apiFetch } = useAuth();
    return useQuery<CustomerNote[]>({
        queryKey: ['customer-notes', customerId],
        queryFn: () =>
            apiFetch<CustomerNote[]>(`/customers/${customerId}/notes`),
        enabled: customerId !== null,
    });
}

export function useCreateCustomerNote() {
    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            customerId,
            content,
            type,
            isPinned,
        }: {
            customerId: number;
            content: string;
            type?: NoteType;
            isPinned?: boolean;
        }) =>
            apiFetch<CustomerNote>(`/customers/${customerId}/notes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content, type, isPinned }),
            }),
        onSuccess: (_, variables) => {
            void queryClient.invalidateQueries({
                queryKey: ['customer-notes', variables.customerId],
            });
        },
    });
}

export function useUpdateCustomerNote() {
    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            noteId,
            data,
        }: {
            noteId: number;
            customerId: number;
            data: Partial<CustomerNote>;
        }) =>
            apiFetch<CustomerNote>(`/customers/notes/${noteId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            }),
        onSuccess: (_, variables) => {
            void queryClient.invalidateQueries({
                queryKey: ['customer-notes', variables.customerId],
            });
        },
    });
}

export function useDeleteCustomerNote() {
    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ noteId }: { noteId: number; customerId: number }) =>
            apiFetch<void>(`/customers/notes/${noteId}`, {
                method: 'DELETE',
            }),
        onSuccess: (_, variables) => {
            void queryClient.invalidateQueries({
                queryKey: ['customer-notes', variables.customerId],
            });
        },
    });
}

// ==================== TAGS ====================

export function useCustomerTags() {
    const { apiFetch } = useAuth();
    return useQuery<CustomerTag[]>({
        queryKey: ['customer-tags'],
        queryFn: () => apiFetch<CustomerTag[]>('/customer-tags'),
    });
}

export function useTagsForCustomer(customerId: number | null) {
    const { apiFetch } = useAuth();
    return useQuery<CustomerTag[]>({
        queryKey: ['customer-tags', customerId],
        queryFn: () => apiFetch<CustomerTag[]>(`/customers/${customerId}/tags`),
        enabled: customerId !== null,
    });
}

export function useCreateCustomerTag() {
    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: { name: string; color?: string }) =>
            apiFetch<CustomerTag>('/customer-tags', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            }),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['customer-tags'] });
        },
    });
}

export function useAssignTags() {
    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            customerId,
            tagIds,
        }: {
            customerId: number;
            tagIds: number[];
        }) =>
            apiFetch<void>(`/customers/${customerId}/tags`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tagIds }),
            }),
        onSuccess: (_, variables) => {
            void queryClient.invalidateQueries({
                queryKey: ['customer-tags', variables.customerId],
            });
        },
    });
}

export function useRemoveTag() {
    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            customerId,
            tagId,
        }: {
            customerId: number;
            tagId: number;
        }) =>
            apiFetch<void>(`/customers/${customerId}/tags/${tagId}`, {
                method: 'DELETE',
            }),
        onSuccess: (_, variables) => {
            void queryClient.invalidateQueries({
                queryKey: ['customer-tags', variables.customerId],
            });
        },
    });
}

// ==================== GROUPS ====================

export function useCustomerGroups() {
    const { apiFetch } = useAuth();
    return useQuery<CustomerGroup[]>({
        queryKey: ['customer-groups'],
        queryFn: () => apiFetch<CustomerGroup[]>('/customer-groups'),
    });
}

export function useCustomerGroup(id: number | null) {
    const { apiFetch } = useAuth();
    return useQuery<CustomerGroup>({
        queryKey: ['customer-group', id],
        queryFn: () => apiFetch<CustomerGroup>(`/customer-groups/${id}`),
        enabled: id !== null,
    });
}

export function useCreateCustomerGroup() {
    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: {
            name: string;
            description?: string;
            color?: string;
            memberIds?: number[];
        }) =>
            apiFetch<CustomerGroup>('/customer-groups', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            }),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: ['customer-groups'],
            });
        },
    });
}

export function useUpdateCustomerGroup() {
    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            id,
            data,
        }: {
            id: number;
            data: { name?: string; description?: string; color?: string };
        }) =>
            apiFetch<CustomerGroup>(`/customer-groups/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            }),
        onSuccess: (_, variables) => {
            void queryClient.invalidateQueries({
                queryKey: ['customer-groups'],
            });
            void queryClient.invalidateQueries({
                queryKey: ['customer-group', variables.id],
            });
        },
    });
}

export function useDeleteCustomerGroup() {
    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) =>
            apiFetch<void>(`/customer-groups/${id}`, { method: 'DELETE' }),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: ['customer-groups'],
            });
        },
    });
}

export function useAddGroupMembers() {
    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            groupId,
            customerIds,
        }: {
            groupId: number;
            customerIds: number[];
        }) =>
            apiFetch<void>(`/customer-groups/${groupId}/members`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ customerIds }),
            }),
        onSuccess: (_, variables) => {
            void queryClient.invalidateQueries({
                queryKey: ['customer-groups'],
            });
            void queryClient.invalidateQueries({
                queryKey: ['customer-group', variables.groupId],
            });
        },
    });
}

export function useRemoveGroupMember() {
    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            groupId,
            customerId,
        }: {
            groupId: number;
            customerId: number;
        }) =>
            apiFetch<void>(
                `/customer-groups/${groupId}/members/${customerId}`,
                {
                    method: 'DELETE',
                },
            ),
        onSuccess: (_, variables) => {
            void queryClient.invalidateQueries({
                queryKey: ['customer-groups'],
            });
            void queryClient.invalidateQueries({
                queryKey: ['customer-group', variables.groupId],
            });
        },
    });
}
