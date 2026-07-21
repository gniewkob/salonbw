import {
    useQuery,
    useMutation,
    useQueryClient,
    keepPreviousData,
} from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useMutationToast } from '@/hooks/useMutationToast';
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
    CustomerOrigin,
    CustomerExtraField,
    ExtraFieldType,
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
    const toast = useToast();

    return useMutation({
        mutationFn: (data: Partial<Customer>) =>
            apiFetch<Customer>('/customers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            }),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['customers'] });
            toast.success('Klient dodany');
        },
        onError: () => {
            toast.error('Nie udało się dodać klienta');
        },
    });
}

export function useUpdateCustomer() {
    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();
    const toast = useToast();

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
            toast.success('Dane klienta zapisane');
        },
        onError: () => {
            toast.error('Nie udało się zapisać klienta');
        },
    });
}

export function useDeleteCustomer() {
    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: (id: number) =>
            apiFetch<{ success: boolean }>(`/customers/${id}`, {
                method: 'DELETE',
            }),
        onSuccess: (_result, id) => {
            void queryClient.invalidateQueries({ queryKey: ['customers'] });
            void queryClient.removeQueries({ queryKey: ['customer', id] });
            toast.success('Klient usunięty');
        },
        onError: () => {
            toast.error('Nie udało się usunąć klienta');
        },
    });
}

// ==================== STATISTICS ====================

export function useCustomerStatistics(
    customerId: number | null,
    options?: { from?: string; to?: string },
) {
    const { apiFetch } = useAuth();
    return useQuery<CustomerStatistics>({
        queryKey: ['customer-statistics', customerId, options],
        queryFn: () => {
            const params = new URLSearchParams();
            if (options?.from) params.set('from', options.from);
            if (options?.to) params.set('to', options.to);
            const queryStr = params.toString();
            return apiFetch<CustomerStatistics>(
                `/customers/${customerId}/statistics${queryStr ? `?${queryStr}` : ''}`,
            );
        },
        enabled: customerId !== null,
    });
}

export function useCustomerEventHistory(
    customerId: number | null,
    options?: {
        limit?: number;
        offset?: number;
        from?: string;
        to?: string;
        status?: string; // comma-separated list of statuses
        withCounts?: boolean;
    },
) {
    const { apiFetch } = useAuth();
    return useQuery<CustomerEventHistory>({
        queryKey: ['customer-events', customerId, options],
        queryFn: () => {
            const params = new URLSearchParams();
            if (options?.limit) params.set('limit', String(options.limit));
            if (options?.offset) params.set('offset', String(options.offset));
            if (options?.from) params.set('from', options.from);
            if (options?.to) params.set('to', options.to);
            if (options?.status) params.set('status', options.status);
            if (options?.withCounts) params.set('withCounts', '1');
            const queryStr = params.toString();
            return apiFetch<CustomerEventHistory>(
                `/customers/${customerId}/events-history${queryStr ? `?${queryStr}` : ''}`,
            );
        },
        enabled: customerId !== null,
    });
}

export interface CustomerFollowUpActionItem {
    id: number;
    appointmentId: number;
    candidateReason: string;
    action: string;
    occurredAt: string;
}

export interface CustomerFollowUpActionsResponse {
    customerId: number;
    items: CustomerFollowUpActionItem[];
}

function normalizeFollowUpActionItem(
    value: unknown,
): CustomerFollowUpActionItem | null {
    if (!value || typeof value !== 'object') return null;
    const row = value as Record<string, unknown>;

    const id = Number(row.id);
    if (!Number.isInteger(id) || id <= 0) return null;

    const action =
        typeof row.action === 'string' && row.action.trim().length > 0
            ? row.action.trim()
            : 'unknown_action';
    const candidateReason =
        typeof row.candidateReason === 'string' &&
        row.candidateReason.trim().length > 0
            ? row.candidateReason.trim()
            : 'unknown_reason';
    const occurredAt =
        typeof row.occurredAt === 'string' && row.occurredAt.trim().length > 0
            ? row.occurredAt
            : '';

    const appointmentIdRaw = Number(row.appointmentId);
    const appointmentId =
        Number.isInteger(appointmentIdRaw) && appointmentIdRaw > 0
            ? appointmentIdRaw
            : 0;

    return {
        id,
        appointmentId,
        candidateReason,
        action,
        occurredAt,
    };
}

function normalizeCustomerFollowUpActionsResponse(
    value: unknown,
    customerId: number,
): CustomerFollowUpActionsResponse {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw new Error('Invalid customer follow-up actions response');
    }
    const payload = value as Record<string, unknown>;
    const payloadCustomerId = Number(payload.customerId);
    const normalizedCustomerId =
        Number.isInteger(payloadCustomerId) && payloadCustomerId > 0
            ? payloadCustomerId
            : customerId;

    const items = Array.isArray(payload.items)
        ? payload.items
              .map(normalizeFollowUpActionItem)
              .filter(
                  (item): item is CustomerFollowUpActionItem => item !== null,
              )
        : [];

    return {
        customerId: normalizedCustomerId,
        items,
    };
}

export function useCustomerFollowUpActions(
    customerId: number | null,
    limit = 10,
) {
    const { apiFetch } = useAuth();
    const normalizedCustomerId =
        customerId !== null && Number.isInteger(customerId) && customerId > 0
            ? customerId
            : null;

    return useQuery<CustomerFollowUpActionsResponse>({
        queryKey: ['customer-follow-up-actions', normalizedCustomerId, limit],
        queryFn: async () => {
            if (normalizedCustomerId === null) {
                throw new Error('Invalid customer id');
            }
            const response = await apiFetch<unknown>(
                `/crm/customers/${normalizedCustomerId}/follow-up-actions?limit=${limit}`,
            );
            return normalizeCustomerFollowUpActionsResponse(
                response,
                normalizedCustomerId,
            );
        },
        enabled: normalizedCustomerId !== null,
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
    const toast = useToast();

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
            toast.success('Notatka dodana');
        },
        onError: () => {
            toast.error('Nie udało się dodać notatki');
        },
    });
}

export function useUpdateCustomerNote() {
    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();
    const toast = useToast();

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
            toast.success('Notatka zapisana');
        },
        onError: () => {
            toast.error('Nie udało się zapisać notatki');
        },
    });
}

export function useDeleteCustomerNote() {
    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: ({ noteId }: { noteId: number; customerId: number }) =>
            apiFetch<void>(`/customers/notes/${noteId}`, {
                method: 'DELETE',
            }),
        onSuccess: (_, variables) => {
            void queryClient.invalidateQueries({
                queryKey: ['customer-notes', variables.customerId],
            });
            toast.success('Notatka usunięta');
        },
        onError: () => {
            toast.error('Nie udało się usunąć notatki');
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
    const toast = useMutationToast();

    return useMutation({
        mutationFn: (data: { name: string; color?: string }) =>
            apiFetch<CustomerTag>('/customer-tags', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            }),
        ...toast.feedback('Tag dodany', 'Nie udało się dodać tagu', () => {
            void queryClient.invalidateQueries({ queryKey: ['customer-tags'] });
        }),
    });
}

export function useAssignTags() {
    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();
    const toast = useMutationToast();

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
            toast
                .feedback('Tagi przypisane', 'Nie udało się przypisać tagów')
                .onSuccess();
        },
        onError: () => {
            toast
                .feedback('Tagi przypisane', 'Nie udało się przypisać tagów')
                .onError();
        },
    });
}

export function useRemoveTag() {
    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();
    const toast = useMutationToast();

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
            toast
                .feedback('Tag usunięty', 'Nie udało się usunąć tagu')
                .onSuccess();
        },
        onError: () => {
            toast
                .feedback('Tag usunięty', 'Nie udało się usunąć tagu')
                .onError();
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
    const toast = useMutationToast();

    return useMutation({
        mutationFn: (data: {
            name: string;
            description?: string;
            color?: string;
            memberIds?: number[];
            parentId?: number | null;
            discountPercent?: number | null;
        }) =>
            apiFetch<CustomerGroup>('/customer-groups', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            }),
        ...toast.feedback('Grupa dodana', 'Nie udało się dodać grupy', () => {
            void queryClient.invalidateQueries({
                queryKey: ['customer-groups'],
            });
        }),
    });
}

export function useUpdateCustomerGroup() {
    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();
    const toast = useMutationToast();

    return useMutation({
        mutationFn: ({
            id,
            data,
        }: {
            id: number;
            data: {
                name?: string;
                description?: string;
                color?: string;
                parentId?: number | null;
                discountPercent?: number | null;
            };
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
            toast
                .feedback('Grupa zapisana', 'Nie udało się zapisać grupy')
                .onSuccess();
        },
        onError: () => {
            toast
                .feedback('Grupa zapisana', 'Nie udało się zapisać grupy')
                .onError();
        },
    });
}

export function useDeleteCustomerGroup() {
    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();
    const toast = useMutationToast();

    return useMutation({
        mutationFn: (id: number) =>
            apiFetch<void>(`/customer-groups/${id}`, { method: 'DELETE' }),
        ...toast.feedback(
            'Grupa usunięta',
            'Nie udało się usunąć grupy',
            () => {
                void queryClient.invalidateQueries({
                    queryKey: ['customer-groups'],
                });
            },
        ),
    });
}

export function useSortCustomerGroups() {
    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (
            items: Array<{
                id: number;
                parentId: number | null;
                sortOrder: number;
            }>,
        ) =>
            apiFetch<CustomerGroup[]>('/customer-groups/sort', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items }),
            }),
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
    const toast = useMutationToast();

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
            toast
                .feedback(
                    'Klienci dodani do grupy',
                    'Nie udało się dodać klientów do grupy',
                )
                .onSuccess();
        },
        onError: () => {
            toast
                .feedback(
                    'Klienci dodani do grupy',
                    'Nie udało się dodać klientów do grupy',
                )
                .onError();
        },
    });
}

export function useRemoveGroupMember() {
    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();
    const toast = useMutationToast();

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
            toast
                .feedback(
                    'Klient usunięty z grupy',
                    'Nie udało się usunąć klienta z grupy',
                )
                .onSuccess();
        },
        onError: () => {
            toast
                .feedback(
                    'Klient usunięty z grupy',
                    'Nie udało się usunąć klienta z grupy',
                )
                .onError();
        },
    });
}

// ==================== ORIGINS ====================

export function useCustomerOrigins() {
    const { apiFetch } = useAuth();
    return useQuery<CustomerOrigin[]>({
        queryKey: ['customer-origins'],
        queryFn: () => apiFetch<CustomerOrigin[]>('/customer-origins'),
    });
}

export function useCreateCustomerOrigin() {
    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (name: string) =>
            apiFetch<CustomerOrigin>('/customer-origins', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name }),
            }),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: ['customer-origins'],
            });
        },
    });
}

export function useUpdateCustomerOrigin() {
    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, name }: { id: number; name: string }) =>
            apiFetch<CustomerOrigin>(`/customer-origins/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name }),
            }),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: ['customer-origins'],
            });
        },
    });
}

export function useDeleteCustomerOrigin() {
    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) =>
            apiFetch<void>(`/customer-origins/${id}`, { method: 'DELETE' }),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: ['customer-origins'],
            });
        },
    });
}

// ==================== EXTRA FIELDS ====================

export function useCustomerExtraFields() {
    const { apiFetch } = useAuth();
    return useQuery<CustomerExtraField[]>({
        queryKey: ['customer-extra-fields'],
        queryFn: () => apiFetch<CustomerExtraField[]>('/customer-extra-fields'),
    });
}

export function useCreateCustomerExtraField() {
    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: {
            label: string;
            type: ExtraFieldType;
            required?: boolean;
            options?: string[];
        }) =>
            apiFetch<CustomerExtraField>('/customer-extra-fields', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            }),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: ['customer-extra-fields'],
            });
        },
    });
}

export function useUpdateCustomerExtraField() {
    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            id,
            data,
        }: {
            id: number;
            data: {
                label?: string;
                type?: ExtraFieldType;
                required?: boolean;
                options?: string[];
            };
        }) =>
            apiFetch<CustomerExtraField>(`/customer-extra-fields/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            }),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: ['customer-extra-fields'],
            });
        },
    });
}

export function useDeleteCustomerExtraField() {
    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) =>
            apiFetch<void>(`/customer-extra-fields/${id}`, {
                method: 'DELETE',
            }),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: ['customer-extra-fields'],
            });
        },
    });
}
