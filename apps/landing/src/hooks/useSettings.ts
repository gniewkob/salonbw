import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import type {
    AllSettings,
    BranchSettings,
    CalendarSettings,
    OnlineBookingSettings,
    UpdateBranchSettingsRequest,
    UpdateCalendarSettingsRequest,
    UpdateOnlineBookingSettingsRequest,
} from '@/types';

export const SETTINGS_QUERY_KEY = ['api', '/settings'] as const;

export function useAllSettings() {
    const { apiFetch } = useAuth();

    return useQuery({
        queryKey: SETTINGS_QUERY_KEY,
        queryFn: async () => {
            return apiFetch<AllSettings>('/settings');
        },
    });
}

export function useBranchSettings() {
    const { apiFetch } = useAuth();

    return useQuery({
        queryKey: [...SETTINGS_QUERY_KEY, 'branch'],
        queryFn: async () => {
            return apiFetch<BranchSettings>('/settings/branch');
        },
    });
}

export function useCalendarSettings() {
    const { apiFetch } = useAuth();

    return useQuery({
        queryKey: [...SETTINGS_QUERY_KEY, 'calendar'],
        queryFn: async () => {
            return apiFetch<CalendarSettings>('/settings/calendar');
        },
    });
}

export function useOnlineBookingSettings() {
    const { apiFetch } = useAuth();

    return useQuery({
        queryKey: [...SETTINGS_QUERY_KEY, 'online-booking'],
        queryFn: async () => {
            return apiFetch<OnlineBookingSettings>('/settings/online-booking');
        },
    });
}

export function useSettingsMutations() {
    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();

    const invalidateAll = () => {
        queryClient.invalidateQueries({ queryKey: SETTINGS_QUERY_KEY });
    };

    const updateBranchSettings = useMutation({
        mutationFn: async (data: UpdateBranchSettingsRequest) => {
            return apiFetch<BranchSettings>('/settings/branch', {
                method: 'PUT',
                body: JSON.stringify(data),
            });
        },
        onSuccess: invalidateAll,
    });

    const updateCalendarSettings = useMutation({
        mutationFn: async (data: UpdateCalendarSettingsRequest) => {
            return apiFetch<CalendarSettings>('/settings/calendar', {
                method: 'PUT',
                body: JSON.stringify(data),
            });
        },
        onSuccess: invalidateAll,
    });

    const updateOnlineBookingSettings = useMutation({
        mutationFn: async (data: UpdateOnlineBookingSettingsRequest) => {
            return apiFetch<OnlineBookingSettings>('/settings/online-booking', {
                method: 'PUT',
                body: JSON.stringify(data),
            });
        },
        onSuccess: invalidateAll,
    });

    return {
        updateBranchSettings,
        updateCalendarSettings,
        updateOnlineBookingSettings,
    };
}
