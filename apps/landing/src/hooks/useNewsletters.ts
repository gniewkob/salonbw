import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import type {
    Newsletter,
    NewsletterRecipient,
    NewsletterStats,
    CreateNewsletterRequest,
    UpdateNewsletterRequest,
    RecipientFilter,
    RecipientPreview,
    RecipientStatus,
} from '@/types';

export const NEWSLETTERS_QUERY_KEY = ['api', '/newsletters'] as const;

export function useNewsletters() {
    const { apiFetch } = useAuth();

    return useQuery({
        queryKey: NEWSLETTERS_QUERY_KEY,
        queryFn: async () => {
            return apiFetch<Newsletter[]>('/newsletters');
        },
    });
}

export function useNewsletter(id: number | null, enabled = true) {
    const { apiFetch } = useAuth();

    return useQuery({
        queryKey: [...NEWSLETTERS_QUERY_KEY, id],
        queryFn: async () => {
            return apiFetch<Newsletter>(`/newsletters/${id}`);
        },
        enabled: enabled && id !== null,
    });
}

export function useNewsletterStats() {
    const { apiFetch } = useAuth();

    return useQuery({
        queryKey: [...NEWSLETTERS_QUERY_KEY, 'stats'],
        queryFn: async () => {
            return apiFetch<NewsletterStats>('/newsletters/stats');
        },
    });
}

export function useNewsletterRecipients(
    id: number | null,
    status?: RecipientStatus,
    enabled = true,
) {
    const { apiFetch } = useAuth();

    return useQuery({
        queryKey: [...NEWSLETTERS_QUERY_KEY, id, 'recipients', status],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (status) params.append('status', status);
            const queryString = params.toString();
            return apiFetch<NewsletterRecipient[]>(
                `/newsletters/${id}/recipients${queryString ? `?${queryString}` : ''}`,
            );
        },
        enabled: enabled && id !== null,
    });
}

export function useNewsletterMutations() {
    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();

    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: NEWSLETTERS_QUERY_KEY });
    };

    const createNewsletter = useMutation({
        mutationFn: async (data: CreateNewsletterRequest) => {
            return apiFetch<Newsletter>('/newsletters', {
                method: 'POST',
                body: JSON.stringify(data),
            });
        },
        onSuccess: invalidate,
    });

    const updateNewsletter = useMutation({
        mutationFn: async ({ id, ...data }: UpdateNewsletterRequest & { id: number }) => {
            return apiFetch<Newsletter>(`/newsletters/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data),
            });
        },
        onSuccess: invalidate,
    });

    const deleteNewsletter = useMutation({
        mutationFn: async (id: number) => {
            return apiFetch<void>(`/newsletters/${id}`, {
                method: 'DELETE',
            });
        },
        onSuccess: invalidate,
    });

    const duplicateNewsletter = useMutation({
        mutationFn: async (id: number) => {
            return apiFetch<Newsletter>(`/newsletters/${id}/duplicate`, {
                method: 'POST',
            });
        },
        onSuccess: invalidate,
    });

    const sendNewsletter = useMutation({
        mutationFn: async ({ id, scheduledAt }: { id: number; scheduledAt?: string }) => {
            return apiFetch<Newsletter>(`/newsletters/${id}/send`, {
                method: 'POST',
                body: JSON.stringify({ scheduledAt }),
            });
        },
        onSuccess: invalidate,
    });

    const cancelNewsletter = useMutation({
        mutationFn: async (id: number) => {
            return apiFetch<Newsletter>(`/newsletters/${id}/cancel`, {
                method: 'POST',
            });
        },
        onSuccess: invalidate,
    });

    const previewRecipients = useMutation({
        mutationFn: async (data: {
            recipientFilter?: RecipientFilter;
            recipientIds?: number[];
        }) => {
            return apiFetch<RecipientPreview>('/newsletters/preview-recipients', {
                method: 'POST',
                body: JSON.stringify(data),
            });
        },
    });

    return {
        createNewsletter,
        updateNewsletter,
        deleteNewsletter,
        duplicateNewsletter,
        sendNewsletter,
        cancelNewsletter,
        previewRecipients,
    };
}
