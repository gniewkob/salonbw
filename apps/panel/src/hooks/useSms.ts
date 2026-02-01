import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import type {
    MessageTemplate,
    SmsLog,
    SmsStats,
    TemplateType,
    MessageChannel,
} from '@/types';

export const TEMPLATES_QUERY_KEY = ['api', '/sms/templates'] as const;
export const SMS_HISTORY_QUERY_KEY = ['api', '/sms/history'] as const;

interface CreateTemplatePayload {
    name: string;
    type: TemplateType;
    channel?: MessageChannel;
    content: string;
    subject?: string;
    description?: string;
    isActive?: boolean;
    isDefault?: boolean;
    availableVariables?: string[];
}

interface UpdateTemplatePayload {
    name?: string;
    type?: TemplateType;
    channel?: MessageChannel;
    content?: string;
    subject?: string;
    description?: string;
    isActive?: boolean;
    isDefault?: boolean;
}

interface SendSmsPayload {
    recipient: string;
    content: string;
    templateId?: number;
    recipientId?: number;
    appointmentId?: number;
}

interface SendBulkSmsPayload {
    recipients: string[];
    content: string;
    templateId?: number;
}

interface SendFromTemplatePayload {
    templateId: number;
    recipient: string;
    recipientId?: number;
    appointmentId?: number;
    variables?: Record<string, string>;
}

interface SmsHistoryFilter {
    channel?: MessageChannel;
    status?: string;
    recipientId?: number;
    appointmentId?: number;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
}

export function useMessageTemplates(options?: {
    type?: TemplateType;
    channel?: MessageChannel;
    isActive?: boolean;
    enabled?: boolean;
}) {
    const { apiFetch } = useAuth();
    const { type, channel, isActive, enabled = true } = options ?? {};

    const queryKey = [
        ...TEMPLATES_QUERY_KEY,
        { type, channel, isActive },
    ] as const;

    const query = useQuery({
        queryKey,
        queryFn: async () => {
            const params = new URLSearchParams();
            if (type) params.set('type', type);
            if (channel) params.set('channel', channel);
            if (isActive !== undefined)
                params.set('isActive', String(isActive));
            const qs = params.toString();
            return apiFetch<MessageTemplate[]>(
                `/sms/templates${qs ? `?${qs}` : ''}`,
            );
        },
        enabled,
    });

    return {
        data: query.data ?? [],
        error: (query.error as Error | null) ?? null,
        loading: query.isLoading,
        refetch: query.refetch,
    };
}

export function useMessageTemplate(id: number | null) {
    const { apiFetch } = useAuth();

    const query = useQuery({
        queryKey: [...TEMPLATES_QUERY_KEY, id],
        queryFn: async () => {
            if (!id) return null;
            return apiFetch<MessageTemplate>(`/sms/templates/${id}`);
        },
        enabled: !!id,
    });

    return {
        data: query.data ?? null,
        error: (query.error as Error | null) ?? null,
        loading: query.isLoading,
    };
}

export function useSmsHistory(filter: SmsHistoryFilter) {
    const { apiFetch } = useAuth();

    const queryKey = [...SMS_HISTORY_QUERY_KEY, filter] as const;

    const query = useQuery({
        queryKey,
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filter.channel) params.set('channel', filter.channel);
            if (filter.status) params.set('status', filter.status);
            if (filter.recipientId)
                params.set('recipientId', String(filter.recipientId));
            if (filter.appointmentId)
                params.set('appointmentId', String(filter.appointmentId));
            if (filter.from) params.set('from', filter.from);
            if (filter.to) params.set('to', filter.to);
            if (filter.page) params.set('page', String(filter.page));
            if (filter.limit) params.set('limit', String(filter.limit));
            const qs = params.toString();
            return apiFetch<{
                items: SmsLog[];
                total: number;
                page: number;
                limit: number;
            }>(`/sms/history${qs ? `?${qs}` : ''}`);
        },
    });

    return {
        data: query.data ?? { items: [], total: 0, page: 1, limit: 20 },
        error: (query.error as Error | null) ?? null,
        loading: query.isLoading,
        refetch: query.refetch,
    };
}

export function useSmsStats(from?: string, to?: string) {
    const { apiFetch } = useAuth();

    const query = useQuery({
        queryKey: ['api', '/sms/stats', { from, to }],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (from) params.set('from', from);
            if (to) params.set('to', to);
            const qs = params.toString();
            return apiFetch<SmsStats>(`/sms/stats${qs ? `?${qs}` : ''}`);
        },
    });

    return {
        data: query.data ?? null,
        error: (query.error as Error | null) ?? null,
        loading: query.isLoading,
    };
}

export function useSmsMutations() {
    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();

    const invalidateAll = () => {
        void queryClient.invalidateQueries({ queryKey: TEMPLATES_QUERY_KEY });
        void queryClient.invalidateQueries({ queryKey: SMS_HISTORY_QUERY_KEY });
    };

    const createTemplate = useMutation({
        mutationFn: async (payload: CreateTemplatePayload) => {
            return apiFetch<MessageTemplate>('/sms/templates', {
                method: 'POST',
                body: JSON.stringify(payload),
            });
        },
        onSuccess: invalidateAll,
    });

    const updateTemplate = useMutation({
        mutationFn: async ({
            id,
            ...payload
        }: UpdateTemplatePayload & { id: number }) => {
            return apiFetch<MessageTemplate>(`/sms/templates/${id}`, {
                method: 'PUT',
                body: JSON.stringify(payload),
            });
        },
        onSuccess: invalidateAll,
    });

    const deleteTemplate = useMutation({
        mutationFn: async (id: number) => {
            return apiFetch<{ success: boolean }>(`/sms/templates/${id}`, {
                method: 'DELETE',
            });
        },
        onSuccess: invalidateAll,
    });

    const sendSms = useMutation({
        mutationFn: async (payload: SendSmsPayload) => {
            return apiFetch<SmsLog>('/sms/send', {
                method: 'POST',
                body: JSON.stringify(payload),
            });
        },
        onSuccess: invalidateAll,
    });

    const sendBulkSms = useMutation({
        mutationFn: async (payload: SendBulkSmsPayload) => {
            return apiFetch<SmsLog[]>('/sms/send-bulk', {
                method: 'POST',
                body: JSON.stringify(payload),
            });
        },
        onSuccess: invalidateAll,
    });

    const sendFromTemplate = useMutation({
        mutationFn: async (payload: SendFromTemplatePayload) => {
            return apiFetch<SmsLog>('/sms/send-from-template', {
                method: 'POST',
                body: JSON.stringify(payload),
            });
        },
        onSuccess: invalidateAll,
    });

    const sendAppointmentReminder = useMutation({
        mutationFn: async (appointmentId: number) => {
            return apiFetch<{ success: boolean; log?: SmsLog }>(
                `/sms/appointments/${appointmentId}/reminder`,
                { method: 'POST' },
            );
        },
        onSuccess: invalidateAll,
    });

    return {
        createTemplate,
        updateTemplate,
        deleteTemplate,
        sendSms,
        sendBulkSms,
        sendFromTemplate,
        sendAppointmentReminder,
    };
}
