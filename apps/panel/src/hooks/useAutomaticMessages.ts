import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useMutationToast } from '@/hooks/useMutationToast';
import type {
    AutomaticMessageRule,
    CreateAutomaticMessageRuleRequest,
    UpdateAutomaticMessageRuleRequest,
    ProcessAutomaticMessagesResult,
} from '@/types';

export const AUTOMATIC_MESSAGES_QUERY_KEY = [
    'api',
    '/automatic-messages',
] as const;

export function useAutomaticMessages() {
    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();
    const toast = useMutationToast();
    const invalidate = () => {
        void queryClient.invalidateQueries({
            queryKey: AUTOMATIC_MESSAGES_QUERY_KEY,
        });
    };

    // Fetch all rules
    const rulesQuery = useQuery({
        queryKey: AUTOMATIC_MESSAGES_QUERY_KEY,
        queryFn: async () => {
            return apiFetch<AutomaticMessageRule[]>('/automatic-messages');
        },
    });

    // Create rule
    const createMutation = useMutation({
        mutationFn: async (data: CreateAutomaticMessageRuleRequest) => {
            return apiFetch<AutomaticMessageRule>('/automatic-messages', {
                method: 'POST',
                body: JSON.stringify(data),
            });
        },
        ...toast.feedback(
            'Reguła dodana',
            'Nie udało się dodać reguły',
            invalidate,
        ),
    });

    // Update rule
    const updateMutation = useMutation({
        mutationFn: async ({
            id,
            data,
        }: {
            id: number;
            data: UpdateAutomaticMessageRuleRequest;
        }) => {
            return apiFetch<AutomaticMessageRule>(`/automatic-messages/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data),
            });
        },
        ...toast.feedback(
            'Reguła zapisana',
            'Nie udało się zapisać reguły',
            invalidate,
        ),
    });

    // Toggle rule active status
    const toggleMutation = useMutation({
        mutationFn: async (id: number) => {
            return apiFetch<AutomaticMessageRule>(
                `/automatic-messages/${id}/toggle`,
                {
                    method: 'PATCH',
                },
            );
        },
        ...toast.feedback(
            'Reguła zaktualizowana',
            'Nie udało się zmienić stanu reguły',
            invalidate,
        ),
    });

    // Delete rule
    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            return apiFetch<void>(`/automatic-messages/${id}`, {
                method: 'DELETE',
            });
        },
        ...toast.feedback(
            'Reguła usunięta',
            'Nie udało się usunąć reguły',
            invalidate,
        ),
    });

    // Process all rules manually
    const processAllMutation = useMutation({
        mutationFn: async () => {
            return apiFetch<ProcessAutomaticMessagesResult[]>(
                '/automatic-messages/process',
                {
                    method: 'POST',
                },
            );
        },
        ...toast.feedback(
            'Reguły przetworzone',
            'Nie udało się przetworzyć reguł',
            invalidate,
        ),
    });

    // Process single rule
    const processOneMutation = useMutation({
        mutationFn: async (id: number) => {
            return apiFetch<ProcessAutomaticMessagesResult>(
                `/automatic-messages/${id}/process`,
                {
                    method: 'POST',
                },
            );
        },
        ...toast.feedback(
            'Reguła przetworzona',
            'Nie udało się przetworzyć reguły',
            invalidate,
        ),
    });

    return {
        rules: rulesQuery.data ?? [],
        loading: rulesQuery.isLoading,
        error: rulesQuery.error as Error | null,
        refetch: rulesQuery.refetch,

        createRule: createMutation.mutateAsync,
        isCreating: createMutation.isPending,

        updateRule: (id: number, data: UpdateAutomaticMessageRuleRequest) =>
            updateMutation.mutateAsync({ id, data }),
        isUpdating: updateMutation.isPending,

        toggleRule: toggleMutation.mutateAsync,
        isToggling: toggleMutation.isPending,

        deleteRule: deleteMutation.mutateAsync,
        isDeleting: deleteMutation.isPending,

        processAll: processAllMutation.mutateAsync,
        isProcessing: processAllMutation.isPending,

        processOne: processOneMutation.mutateAsync,
        isProcessingOne: processOneMutation.isPending,
    };
}
