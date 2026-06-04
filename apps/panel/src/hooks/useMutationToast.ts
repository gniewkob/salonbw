import { useToast } from '@/contexts/ToastContext';

/**
 * Small helper that turns a (successLabel, errorLabel) pair into a
 * {onSuccess, onError} object spread-friendly into useMutation options.
 * Returned `onSuccess` accepts a `then` callback to invalidate queries
 * before the toast fires; keeps the toast firing only when the parent
 * mutation actually applies.
 *
 * Usage:
 *
 *     const toast = useMutationToast();
 *     return useMutation({
 *         mutationFn: ...,
 *         ...toast.feedback('Klient dodany', 'Nie udało się dodać klienta', () => {
 *             queryClient.invalidateQueries({ queryKey: ['customers'] });
 *         }),
 *     });
 */
export function useMutationToast() {
    const toast = useToast();
    return {
        feedback: (
            successLabel: string,
            errorLabel: string,
            onSuccessSideEffect?: () => void,
        ) => ({
            onSuccess: () => {
                onSuccessSideEffect?.();
                toast.success(successLabel);
            },
            onError: () => {
                toast.error(errorLabel);
            },
        }),
    };
}
