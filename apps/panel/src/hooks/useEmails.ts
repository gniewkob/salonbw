'use client';

import { useQuery } from '@tanstack/react-query';
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
};

export function useEmailHistory(filter: EmailHistoryFilter) {
    const { apiFetch } = useAuth();

    const queryKey = [...EMAIL_HISTORY_QUERY_KEY, filter] as const;

    const query = useQuery({
        queryKey,
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filter.recipientId)
                params.set('recipientId', String(filter.recipientId));
            if (filter.status) params.set('status', filter.status);
            if (filter.from) params.set('from', filter.from);
            if (filter.to) params.set('to', filter.to);
            if (filter.page) params.set('page', String(filter.page));
            if (filter.limit) params.set('limit', String(filter.limit));
            const qs = params.toString();
            return apiFetch<{
                items: Array<{
                    id: number;
                    to: string;
                    subject: string;
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
    });

    return {
        data: query.data ?? { items: [], total: 0, page: 1, limit: 20 },
        error: (query.error as Error | null) ?? null,
        loading: query.isLoading,
        refetch: query.refetch,
    };
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
