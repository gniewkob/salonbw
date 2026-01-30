import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import type {
    CalendarData,
    CalendarView,
    TimeBlock,
    TimeBlockType,
} from '@/types';

export const CALENDAR_QUERY_KEY = ['api', '/calendar/events'] as const;
export const TIME_BLOCKS_QUERY_KEY = ['api', '/calendar/time-blocks'] as const;

interface UseCalendarOptions {
    date: string;
    view?: CalendarView;
    employeeIds?: number[];
    enabled?: boolean;
}

interface CreateTimeBlockPayload {
    employeeId: number;
    startTime: string;
    endTime: string;
    type: TimeBlockType;
    title?: string;
    notes?: string;
    allDay?: boolean;
}

interface UpdateTimeBlockPayload {
    startTime?: string;
    endTime?: string;
    type?: TimeBlockType;
    title?: string;
    notes?: string;
    allDay?: boolean;
}

interface RescheduleAppointmentPayload {
    startTime: string;
    endTime?: string;
    employeeId?: number;
    force?: boolean;
}

export function useCalendar(options: UseCalendarOptions) {
    const { apiFetch } = useAuth();
    const { date, view = 'day', employeeIds, enabled = true } = options;

    const queryKey = [
        ...CALENDAR_QUERY_KEY,
        { date, view, employeeIds },
    ] as const;

    const query = useQuery({
        queryKey,
        queryFn: async () => {
            const params = new URLSearchParams({
                date,
                view,
            });
            if (employeeIds && employeeIds.length > 0) {
                params.set('employeeIds', employeeIds.join(','));
            }
            return apiFetch<CalendarData>(
                `/calendar/events?${params.toString()}`,
            );
        },
        enabled,
    });

    return {
        data: query.data ?? null,
        error: (query.error as Error | null) ?? null,
        loading: query.isLoading,
        refetch: query.refetch,
        queryKey,
    };
}

export function useTimeBlocks(from: string, to: string, employeeId?: number) {
    const { apiFetch } = useAuth();

    const queryKey = [
        ...TIME_BLOCKS_QUERY_KEY,
        { from, to, employeeId },
    ] as const;

    const query = useQuery({
        queryKey,
        queryFn: async () => {
            const params = new URLSearchParams({ from, to });
            if (employeeId) {
                params.set('employeeId', String(employeeId));
            }
            return apiFetch<TimeBlock[]>(
                `/calendar/time-blocks?${params.toString()}`,
            );
        },
    });

    return {
        data: query.data ?? null,
        error: (query.error as Error | null) ?? null,
        loading: query.isLoading,
        refetch: query.refetch,
        queryKey,
    };
}

export function useCalendarMutations() {
    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();

    const invalidateCalendar = () => {
        void queryClient.invalidateQueries({ queryKey: CALENDAR_QUERY_KEY });
        void queryClient.invalidateQueries({ queryKey: TIME_BLOCKS_QUERY_KEY });
    };

    const createTimeBlock = useMutation({
        mutationFn: async (payload: CreateTimeBlockPayload) => {
            return apiFetch<TimeBlock>('/calendar/time-blocks', {
                method: 'POST',
                body: JSON.stringify(payload),
            });
        },
        onSuccess: invalidateCalendar,
    });

    const updateTimeBlock = useMutation({
        mutationFn: async ({
            id,
            ...payload
        }: UpdateTimeBlockPayload & { id: number }) => {
            return apiFetch<TimeBlock>(`/calendar/time-blocks/${id}`, {
                method: 'PATCH',
                body: JSON.stringify(payload),
            });
        },
        onSuccess: invalidateCalendar,
    });

    const deleteTimeBlock = useMutation({
        mutationFn: async (id: number) => {
            return apiFetch<{ success: boolean }>(
                `/calendar/time-blocks/${id}`,
                {
                    method: 'DELETE',
                },
            );
        },
        onSuccess: invalidateCalendar,
    });

    const rescheduleAppointment = useMutation({
        mutationFn: async ({
            id,
            ...payload
        }: RescheduleAppointmentPayload & { id: number }) => {
            return apiFetch(`/appointments/${id}/reschedule`, {
                method: 'PATCH',
                body: JSON.stringify(payload),
            });
        },
        onSuccess: invalidateCalendar,
    });

    const checkConflicts = async (
        employeeId: number,
        startTime: string,
        endTime: string,
        excludeAppointmentId?: number,
    ) => {
        const params = new URLSearchParams({
            employeeId: String(employeeId),
            startTime,
            endTime,
        });
        if (excludeAppointmentId) {
            params.set('excludeAppointmentId', String(excludeAppointmentId));
        }
        return apiFetch<{
            hasConflict: boolean;
            conflictingEvents: Array<{ id: number; title: string }>;
        }>(`/calendar/conflicts?${params.toString()}`);
    };

    return {
        createTimeBlock,
        updateTimeBlock,
        deleteTimeBlock,
        rescheduleAppointment,
        checkConflicts,
    };
}
