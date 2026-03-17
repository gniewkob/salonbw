import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { ActivityLogFeedResponse } from '@/types';

export interface ActivityLogFilters {
    activity?: string;
    category?: string;
    userId?: number;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
}

export function useActivityLogs(filters: ActivityLogFilters) {
    const { apiFetch } = useAuth();

    return useQuery({
        queryKey: ['activity-logs', filters],
        queryFn: () => {
            const params = new URLSearchParams();
            if (filters.activity) params.set('activity', filters.activity);
            if (filters.category) params.set('category', filters.category);
            if (filters.userId) params.set('userId', String(filters.userId));
            if (filters.from) params.set('from', filters.from);
            if (filters.to) params.set('to', filters.to);
            if (filters.page) params.set('page', String(filters.page));
            if (filters.limit) params.set('limit', String(filters.limit));

            const query = params.toString();
            return apiFetch<ActivityLogFeedResponse>(
                `/logs/activity-feed${query ? `?${query}` : ''}`,
            );
        },
    });
}
