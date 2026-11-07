import {
    keepPreviousData,
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import {
    CATALOG_PATH,
    CommunicationCatalog,
    CommunicationScope,
    CommunicationState,
    ConsentHistoryPage,
    GrantConsentInput,
    PreferenceChange,
    WithdrawConsentInput,
    communicationPaths,
    newIdempotencyKey,
} from '@/api/communicationConsents';

export const communicationKeys = {
    catalog: ['communication-catalog'] as const,
    state: (scope: CommunicationScope) =>
        [
            'communication-state',
            scope.kind === 'self' ? 'self' : scope.customerId,
        ] as const,
    history: (scope: CommunicationScope, page?: number) =>
        [
            'communication-history',
            scope.kind === 'self' ? 'self' : scope.customerId,
            ...(page === undefined ? [] : [page]),
        ] as const,
};

/** Every mutation carries an idempotency key created once per confirmation. */
type WithKey<T> = T & { idempotencyKey?: string };

export function useCommunicationCatalog() {
    const { apiFetch } = useAuth();
    return useQuery({
        queryKey: communicationKeys.catalog,
        queryFn: () => apiFetch<CommunicationCatalog>(CATALOG_PATH),
        staleTime: 10 * 60 * 1000,
    });
}

export function useCommunicationState(scope: CommunicationScope | null) {
    const { apiFetch } = useAuth();
    return useQuery({
        queryKey: scope
            ? communicationKeys.state(scope)
            : ['communication-state', 'none'],
        queryFn: () =>
            apiFetch<CommunicationState>(communicationPaths(scope!).state),
        enabled: scope !== null,
    });
}

export function useConsentHistory(
    scope: CommunicationScope | null,
    page = 1,
    limit = 20,
) {
    const { apiFetch } = useAuth();
    return useQuery({
        queryKey: scope
            ? communicationKeys.history(scope, page)
            : ['communication-history', 'none'],
        queryFn: () =>
            apiFetch<ConsentHistoryPage>(
                `${communicationPaths(scope!).history}?page=${page}&limit=${limit}`,
            ),
        enabled: scope !== null,
        placeholderData: keepPreviousData,
    });
}

function useCommunicationMutation<TInput>(
    scope: CommunicationScope,
    request: (input: TInput) => { path: string; method: string; body: unknown },
    successMessage: string,
) {
    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();
    const toast = useToast();
    return useMutation({
        mutationFn: ({ idempotencyKey, ...input }: WithKey<TInput>) => {
            const { path, method, body } = request(input as TInput);
            return apiFetch<CommunicationState>(path, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Idempotency-Key': idempotencyKey ?? newIdempotencyKey(),
                },
                body: JSON.stringify(body),
            });
        },
        onSuccess: (state) => {
            // Server state is authoritative; never optimistic for consent.
            queryClient.setQueryData(communicationKeys.state(scope), state);
            void queryClient.invalidateQueries({
                queryKey: communicationKeys.history(scope),
            });
            if (scope.kind === 'customer') {
                void queryClient.invalidateQueries({
                    queryKey: ['customer', scope.customerId],
                });
            }
            toast.success(successMessage);
        },
        onError: (error: unknown) => {
            toast.error(
                error instanceof Error && error.message
                    ? error.message
                    : 'Nie udało się zapisać zmiany zgody',
            );
        },
    });
}

export function useGrantConsent(scope: CommunicationScope) {
    return useCommunicationMutation<GrantConsentInput>(
        scope,
        (input) => ({
            path: communicationPaths(scope).grant,
            method: 'POST',
            body:
                scope.kind === 'self'
                    ? {
                          purpose: input.purpose,
                          channel: input.channel,
                          consentTextVersion: input.consentTextVersion,
                      }
                    : input,
        }),
        'Zgoda zapisana',
    );
}

export function useWithdrawConsent(scope: CommunicationScope) {
    return useCommunicationMutation<WithdrawConsentInput>(
        scope,
        (input) => ({
            path: communicationPaths(scope).withdraw,
            method: 'POST',
            body: input,
        }),
        'Zgoda wycofana',
    );
}

export function useUpdateCommunicationPreferences(scope: CommunicationScope) {
    return useCommunicationMutation<{ changes: PreferenceChange[] }>(
        scope,
        (input) => ({
            path: communicationPaths(scope).state,
            method: 'PUT',
            body: input,
        }),
        'Preferencje zapisane',
    );
}
