'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import type { EmailLog } from '@/types';

export const EMAIL_HISTORY_QUERY_KEY = ['api', '/emails/history'] as const;

type EmailHistoryFilter = {
    recipientId?: number;
    status?: 'pending' | 'sent' | 'failed';
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
    enabled?: boolean;
};

type SendEmailPayload = {
    to: string;
    subject: string;
    template: string;
    data?: Record<string, string>;
    recipientId?: number;
};

type SendBulkEmailPayload = {
    recipients: string[];
    subject: string;
    template: string;
    data?: Record<string, string>;
};

export function useEmailHistory(filter: EmailHistoryFilter) {
    const { apiFetch } = useAuth();
    const { enabled = true, ...resolvedFilter } = filter;

    const queryKey = [...EMAIL_HISTORY_QUERY_KEY, resolvedFilter] as const;

    const query = useQuery({
        queryKey,
        queryFn: async () => {
            const params = new URLSearchParams();
            if (resolvedFilter.recipientId)
                params.set('recipientId', String(resolvedFilter.recipientId));
            if (resolvedFilter.status)
                params.set('status', resolvedFilter.status);
            if (resolvedFilter.from) params.set('from', resolvedFilter.from);
            if (resolvedFilter.to) params.set('to', resolvedFilter.to);
            if (resolvedFilter.page)
                params.set('page', String(resolvedFilter.page));
            if (resolvedFilter.limit)
                params.set('limit', String(resolvedFilter.limit));
            const qs = params.toString();
            return apiFetch<{
                items: Array<{
                    id: number;
                    to: string;
                    subject: string;
                    template?: string;
                    status: string;
                    sentAt: string | null;
                    createdAt: string;
                    errorMessage: string | null;
                    recipientId: number | null;
                }>;
                total: number;
                page: number;
                limit: number;
            }>(`/emails/history${qs ? `?${qs}` : ''}`);
        },
        enabled,
    });

    return {
        data: query.data ?? { items: [], total: 0, page: 1, limit: 20 },
        error: (query.error as Error | null) ?? null,
        loading: query.isLoading,
        refetch: query.refetch,
    };
}

export function useEmailHistoryItem(id: number | null) {
    const { apiFetch } = useAuth();

    const query = useQuery({
        queryKey: [...EMAIL_HISTORY_QUERY_KEY, 'detail', id],
        queryFn: async () => {
            if (!id) return null;
            return apiFetch<{
                id: number;
                to: string;
                subject: string;
                template?: string;
                status: string;
                sentAt: string | null;
                createdAt: string;
                errorMessage: string | null;
                recipientId: number | null;
                recipientUser?: { id: number; name: string } | null;
                sentBy?: { id: number; name: string } | null;
            }>(`/emails/history/${id}`);
        },
        enabled: !!id,
    });

    return {
        data: query.data
            ? ({
                  id: query.data.id,
                  recipient: query.data.to,
                  subject: query.data.subject,
                  status: query.data.status,
                  sentAt: query.data.sentAt ?? query.data.createdAt,
                  createdAt: query.data.createdAt,
                  template: query.data.template,
                  errorMessage: query.data.errorMessage,
                  recipientId: query.data.recipientId,
                  recipientUser: query.data.recipientUser,
                  sentBy: query.data.sentBy,
              } satisfies EmailLog)
            : null,
        error: (query.error as Error | null) ?? null,
        loading: query.isLoading,
        refetch: query.refetch,
    };
}

export function useEmailMutations() {
    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();

    const invalidate = () => {
        void queryClient.invalidateQueries({
            queryKey: EMAIL_HISTORY_QUERY_KEY,
        });
    };

    const sendEmailAuth = useMutation({
        mutationFn: async (payload: SendEmailPayload) => {
            return apiFetch<{ status: string }>('/emails/send-auth', {
                method: 'POST',
                body: JSON.stringify(payload),
            });
        },
        onSuccess: invalidate,
    });

    const sendBulkEmail = useMutation({
        mutationFn: async (payload: SendBulkEmailPayload) => {
            return apiFetch<{ status: string; total: number }>(
                '/emails/send-bulk',
                {
                    method: 'POST',
                    body: JSON.stringify(payload),
                },
            );
        },
        onSuccess: invalidate,
    });

    return { sendEmailAuth, sendBulkEmail };
}

// Back-compat: older UI expects a flat list of EmailLog.
export function useEmails() {
    const { data, error, loading, refetch } = useEmailHistory({
        page: 1,
        limit: 50,
    });

    const items: EmailLog[] = data.items.map((e) => ({
        id: e.id,
        recipient: e.to,
        subject: e.subject,
        status: e.status,
        sentAt: e.sentAt ?? e.createdAt,
    }));

    return { data: items, error, loading, refetch };
}
