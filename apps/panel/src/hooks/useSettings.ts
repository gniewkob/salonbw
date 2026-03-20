import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import type {
    AllSettings,
    BranchSettings,
    CalendarNamedView,
    CalendarSettings,
    OnlineBookingSettings,
    PaymentConfigurationSettings,
    SmsSettings,
    ReminderSettings,
    DataProtectionSettings,
    DataProtectionEmployeeLimit,
    UpdateBranchSettingsRequest,
    UpdateCalendarSettingsRequest,
    UpdateOnlineBookingSettingsRequest,
    UpdatePaymentConfigurationRequest,
    UpdateReminderSettingsRequest,
    UpdateDataProtectionRequest,
    UpdateDataProtectionEmployeeLimitRequest,
} from '@/types';

export const SETTINGS_QUERY_KEY = ['api', '/settings'] as const;
export const CALENDAR_VIEWS_QUERY_KEY = [
    ...SETTINGS_QUERY_KEY,
    'calendar-views',
] as const;

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

export function useCalendarViews() {
    const { apiFetch } = useAuth();

    return useQuery({
        queryKey: CALENDAR_VIEWS_QUERY_KEY,
        queryFn: async () => {
            return apiFetch<CalendarNamedView[]>('/settings/calendar-views');
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

export function useSmsSettings() {
    const { apiFetch } = useAuth();

    return useQuery({
        queryKey: [...SETTINGS_QUERY_KEY, 'sms'],
        queryFn: async () => {
            return apiFetch<SmsSettings>('/settings/sms');
        },
    });
}

export function useReminderSettings() {
    const { apiFetch } = useAuth();

    return useQuery({
        queryKey: [...SETTINGS_QUERY_KEY, 'reminders'],
        queryFn: async () => {
            return apiFetch<ReminderSettings>('/settings/reminders');
        },
    });
}

export function useDataProtectionSettings() {
    const { apiFetch } = useAuth();

    return useQuery({
        queryKey: [...SETTINGS_QUERY_KEY, 'data-protection'],
        queryFn: async () => {
            return apiFetch<DataProtectionSettings>(
                '/settings/data-protection',
            );
        },
    });
}

export function useDataProtectionEmployeeLimits() {
    const { apiFetch } = useAuth();

    return useQuery({
        queryKey: [...SETTINGS_QUERY_KEY, 'data-protection', 'employee-limits'],
        queryFn: async () => {
            return apiFetch<DataProtectionEmployeeLimit[]>(
                '/settings/data-protection/employee-limits',
            );
        },
    });
}

export function usePaymentConfigurationSettings() {
    const { apiFetch } = useAuth();

    return useQuery({
        queryKey: [...SETTINGS_QUERY_KEY, 'payment-configuration'],
        queryFn: async () => {
            return apiFetch<PaymentConfigurationSettings>(
                '/settings/payment-configuration',
            );
        },
    });
}

export function useSettingsMutations() {
    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();

    const invalidateAll = () => {
        void queryClient.invalidateQueries({ queryKey: SETTINGS_QUERY_KEY });
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

    const createCalendarView = useMutation({
        mutationFn: async (data: { name: string; employeeIds: number[] }) => {
            return apiFetch<CalendarNamedView>('/settings/calendar-views', {
                method: 'POST',
                body: JSON.stringify(data),
            });
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: CALENDAR_VIEWS_QUERY_KEY,
            });
        },
    });

    const updateCalendarView = useMutation({
        mutationFn: async ({
            id,
            data,
        }: {
            id: number;
            data: {
                name: string;
                employeeIds: number[];
            };
        }) => {
            return apiFetch<CalendarNamedView>(
                `/settings/calendar-views/${id}`,
                {
                    method: 'PUT',
                    body: JSON.stringify(data),
                },
            );
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: CALENDAR_VIEWS_QUERY_KEY,
            });
        },
    });

    const deleteCalendarView = useMutation({
        mutationFn: async (id: number) => {
            return apiFetch<{ success: boolean }>(
                `/settings/calendar-views/${id}`,
                {
                    method: 'DELETE',
                },
            );
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: CALENDAR_VIEWS_QUERY_KEY,
            });
        },
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

    const updateSmsSettings = useMutation({
        mutationFn: async (data: Partial<SmsSettings>) => {
            return apiFetch<SmsSettings>('/settings/sms', {
                method: 'PUT',
                body: JSON.stringify(data),
            });
        },
        onSuccess: invalidateAll,
    });

    const updateReminderSettings = useMutation({
        mutationFn: async (data: UpdateReminderSettingsRequest) => {
            return apiFetch<ReminderSettings>('/settings/reminders', {
                method: 'PUT',
                body: JSON.stringify(data),
            });
        },
        onSuccess: invalidateAll,
    });

    const updateDataProtection = useMutation({
        mutationFn: async (data: UpdateDataProtectionRequest) => {
            return apiFetch<DataProtectionSettings>(
                '/settings/data-protection',
                {
                    method: 'PUT',
                    body: JSON.stringify(data),
                },
            );
        },
        onSuccess: invalidateAll,
    });

    const updateDataProtectionEmployeeLimit = useMutation({
        mutationFn: async ({
            id,
            data,
        }: {
            id: number;
            data: UpdateDataProtectionEmployeeLimitRequest;
        }) => {
            return apiFetch<DataProtectionEmployeeLimit>(
                `/settings/data-protection/employee-limits/${id}`,
                {
                    method: 'PUT',
                    body: JSON.stringify(data),
                },
            );
        },
        onSuccess: () => {
            invalidateAll();
            void queryClient.invalidateQueries({
                queryKey: [
                    ...SETTINGS_QUERY_KEY,
                    'data-protection',
                    'employee-limits',
                ],
            });
        },
    });

    const updatePaymentConfiguration = useMutation({
        mutationFn: async (data: UpdatePaymentConfigurationRequest) => {
            return apiFetch<PaymentConfigurationSettings>(
                '/settings/payment-configuration',
                {
                    method: 'PUT',
                    body: JSON.stringify(data),
                },
            );
        },
        onSuccess: invalidateAll,
    });

    return {
        updateBranchSettings,
        updateCalendarSettings,
        createCalendarView,
        updateCalendarView,
        deleteCalendarView,
        updateOnlineBookingSettings,
        updateSmsSettings,
        updateReminderSettings,
        updateDataProtection,
        updateDataProtectionEmployeeLimit,
        updatePaymentConfiguration,
    };
}
