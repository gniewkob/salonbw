import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import type {
    DayOfWeek,
    TimetableTemplate,
    TimetableTemplateDayKind,
} from '@/types';

export const TIMETABLE_TEMPLATES_QUERY_KEY = [
    'api',
    '/timetable-templates',
] as const;

interface TimetableTemplateDayPayload {
    dayOfWeek: DayOfWeek;
    kind: TimetableTemplateDayKind;
    startTime?: string;
    endTime?: string;
}

interface CreateTimetableTemplatePayload {
    name: string;
    colorClass: TimetableTemplate['colorClass'];
    days: TimetableTemplateDayPayload[];
}

interface UpdateTimetableTemplatePayload {
    id: number;
    name?: string;
    colorClass?: TimetableTemplate['colorClass'];
    days?: TimetableTemplateDayPayload[];
}

export function useTimetableTemplates() {
    const { apiFetch } = useAuth();

    const query = useQuery({
        queryKey: TIMETABLE_TEMPLATES_QUERY_KEY,
        queryFn: async () =>
            apiFetch<TimetableTemplate[]>('/timetable-templates'),
    });

    return {
        data: query.data ?? [],
        error: (query.error as Error | null) ?? null,
        loading: query.isLoading,
        refetch: query.refetch,
    };
}

export function useTimetableTemplateMutations() {
    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();

    const invalidate = () => {
        void queryClient.invalidateQueries({
            queryKey: TIMETABLE_TEMPLATES_QUERY_KEY,
        });
    };

    const createTemplate = useMutation({
        mutationFn: async (payload: CreateTimetableTemplatePayload) =>
            apiFetch<TimetableTemplate>('/timetable-templates', {
                method: 'POST',
                body: JSON.stringify(payload),
            }),
        onSuccess: invalidate,
    });

    const updateTemplate = useMutation({
        mutationFn: async ({
            id,
            ...payload
        }: UpdateTimetableTemplatePayload) =>
            apiFetch<TimetableTemplate>(`/timetable-templates/${id}`, {
                method: 'PATCH',
                body: JSON.stringify(payload),
            }),
        onSuccess: invalidate,
    });

    const deleteTemplate = useMutation({
        mutationFn: async (id: number) =>
            apiFetch<{ success: boolean }>(`/timetable-templates/${id}`, {
                method: 'DELETE',
            }),
        onSuccess: invalidate,
    });

    return {
        createTemplate,
        updateTemplate,
        deleteTemplate,
    };
}
