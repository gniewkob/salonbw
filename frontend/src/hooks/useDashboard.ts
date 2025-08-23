import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardResponse } from '@/types';

export interface DashboardData extends DashboardResponse {}

export function useDashboard() {
    const { apiFetch } = useAuth();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        const getDashboardData = async () => {
            try {
                const d = await apiFetch<DashboardData>('/dashboard');
                if (mounted) setData(d);
            } finally {
                if (mounted) setLoading(false);
            }
        };
        void getDashboardData();
        return () => {
            mounted = false;
        };
    }, [apiFetch]);

    return { data, loading };
}
