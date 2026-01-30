import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import type {
    Timetable,
    TimetableSlot,
    TimetableException,
    EmployeeAvailability,
    DayOfWeek,
    ExceptionType,
} from '@/types';

export const TIMETABLES_QUERY_KEY = ['api', '/timetables'] as const;

interface CreateTimetablePayload {
    employeeId: number;
    name: string;
    description?: string;
    validFrom: string;
    validTo?: string;
    slots?: Array<{
        dayOfWeek: DayOfWeek;
        startTime: string;
        endTime: string;
        isBreak?: boolean;
        notes?: string;
    }>;
}

interface UpdateTimetablePayload {
    name?: string;
    description?: string;
    validFrom?: string;
    validTo?: string | null;
    isActive?: boolean;
    slots?: Array<{
        dayOfWeek: DayOfWeek;
        startTime: string;
        endTime: string;
        isBreak?: boolean;
        notes?: string;
    }>;
}

interface CreateExceptionPayload {
    date: string;
    type: ExceptionType;
    title?: string;
    reason?: string;
    customStartTime?: string;
    customEndTime?: string;
    isAllDay?: boolean;
}

interface UpdateExceptionPayload {
    type?: ExceptionType;
    title?: string;
    reason?: string;
    customStartTime?: string;
    customEndTime?: string;
    isAllDay?: boolean;
}

export function useTimetables(options?: {
    employeeId?: number;
    isActive?: boolean;
    enabled?: boolean;
}) {
    const { apiFetch } = useAuth();
    const { employeeId, isActive, enabled = true } = options ?? {};

    const queryKey = [
        ...TIMETABLES_QUERY_KEY,
        { employeeId, isActive },
    ] as const;

    const query = useQuery({
        queryKey,
        queryFn: async () => {
            const params = new URLSearchParams();
            if (employeeId !== undefined) {
                params.set('employeeId', String(employeeId));
            }
            if (isActive !== undefined) {
                params.set('isActive', String(isActive));
            }
            const qs = params.toString();
            return apiFetch<Timetable[]>(`/timetables${qs ? `?${qs}` : ''}`);
        },
        enabled,
    });

    return {
        data: query.data ?? [],
        error: (query.error as Error | null) ?? null,
        loading: query.isLoading,
        refetch: query.refetch,
        queryKey,
    };
}

export function useTimetable(id: number | null) {
    const { apiFetch } = useAuth();

    const queryKey = [...TIMETABLES_QUERY_KEY, id] as const;

    const query = useQuery({
        queryKey,
        queryFn: async () => {
            if (!id) return null;
            return apiFetch<Timetable>(`/timetables/${id}`);
        },
        enabled: !!id,
    });

    return {
        data: query.data ?? null,
        error: (query.error as Error | null) ?? null,
        loading: query.isLoading,
        refetch: query.refetch,
    };
}

export function useEmployeeAvailability(
    employeeId: number | null,
    from: string,
    to: string,
) {
    const { apiFetch } = useAuth();

    const queryKey = [
        'api',
        '/timetables/availability',
        { employeeId, from, to },
    ] as const;

    const query = useQuery({
        queryKey,
        queryFn: async () => {
            if (!employeeId) return null;
            const params = new URLSearchParams({ from, to });
            return apiFetch<EmployeeAvailability>(
                `/timetables/employees/${employeeId}/availability?${params.toString()}`,
            );
        },
        enabled: !!employeeId && !!from && !!to,
    });

    return {
        data: query.data ?? null,
        error: (query.error as Error | null) ?? null,
        loading: query.isLoading,
        refetch: query.refetch,
    };
}

export function useTimetableExceptions(
    timetableId: number | null,
    options?: { from?: string; to?: string; type?: ExceptionType },
) {
    const { apiFetch } = useAuth();
    const { from, to, type } = options ?? {};

    const queryKey = [
        'api',
        '/timetables/exceptions',
        { timetableId, from, to, type },
    ] as const;

    const query = useQuery({
        queryKey,
        queryFn: async () => {
            if (!timetableId) return [];
            const params = new URLSearchParams();
            if (from) params.set('from', from);
            if (to) params.set('to', to);
            if (type) params.set('type', type);
            const qs = params.toString();
            return apiFetch<TimetableException[]>(
                `/timetables/${timetableId}/exceptions${qs ? `?${qs}` : ''}`,
            );
        },
        enabled: !!timetableId,
    });

    return {
        data: query.data ?? [],
        error: (query.error as Error | null) ?? null,
        loading: query.isLoading,
        refetch: query.refetch,
    };
}

export function useTimetableMutations() {
    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();

    const invalidateTimetables = () => {
        void queryClient.invalidateQueries({ queryKey: TIMETABLES_QUERY_KEY });
        void queryClient.invalidateQueries({
            queryKey: ['api', '/timetables/availability'],
        });
        void queryClient.invalidateQueries({
            queryKey: ['api', '/timetables/exceptions'],
        });
    };

    const createTimetable = useMutation({
        mutationFn: async (payload: CreateTimetablePayload) => {
            return apiFetch<Timetable>('/timetables', {
                method: 'POST',
                body: JSON.stringify(payload),
            });
        },
        onSuccess: invalidateTimetables,
    });

    const updateTimetable = useMutation({
        mutationFn: async ({
            id,
            ...payload
        }: UpdateTimetablePayload & { id: number }) => {
            return apiFetch<Timetable>(`/timetables/${id}`, {
                method: 'PATCH',
                body: JSON.stringify(payload),
            });
        },
        onSuccess: invalidateTimetables,
    });

    const deleteTimetable = useMutation({
        mutationFn: async (id: number) => {
            return apiFetch<{ success: boolean }>(`/timetables/${id}`, {
                method: 'DELETE',
            });
        },
        onSuccess: invalidateTimetables,
    });

    const createException = useMutation({
        mutationFn: async ({
            timetableId,
            ...payload
        }: CreateExceptionPayload & { timetableId: number }) => {
            return apiFetch<TimetableException>(
                `/timetables/${timetableId}/exceptions`,
                {
                    method: 'POST',
                    body: JSON.stringify(payload),
                },
            );
        },
        onSuccess: invalidateTimetables,
    });

    const updateException = useMutation({
        mutationFn: async ({
            id,
            ...payload
        }: UpdateExceptionPayload & { id: number }) => {
            return apiFetch<TimetableException>(`/timetables/exceptions/${id}`, {
                method: 'PATCH',
                body: JSON.stringify(payload),
            });
        },
        onSuccess: invalidateTimetables,
    });

    const deleteException = useMutation({
        mutationFn: async (id: number) => {
            return apiFetch<{ success: boolean }>(
                `/timetables/exceptions/${id}`,
                {
                    method: 'DELETE',
                },
            );
        },
        onSuccess: invalidateTimetables,
    });

    const approveException = useMutation({
        mutationFn: async (id: number) => {
            return apiFetch<TimetableException>(
                `/timetables/exceptions/${id}/approve`,
                {
                    method: 'POST',
                },
            );
        },
        onSuccess: invalidateTimetables,
    });

    return {
        createTimetable,
        updateTimetable,
        deleteTimetable,
        createException,
        updateException,
        deleteException,
        approveException,
    };
}
