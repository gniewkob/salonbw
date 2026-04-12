import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardResponse, CustomerDashboardResponse } from '@/types';

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

    return { data, upcoming: data?.upcomingAppointments ?? [], loading };
}

export function useCustomerDashboard() {
    const { apiFetch } = useAuth();
    const [data, setData] = useState<CustomerDashboardResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        let mounted = true;
        const getCustomerDashboard = async () => {
            try {
                const d =
                    await apiFetch<CustomerDashboardResponse>(
                        '/dashboard/customer',
                    );
                if (mounted) setData(d);
            } catch (err) {
                if (mounted)
                    setError(
                        err instanceof Error ? err : new Error(String(err)),
                    );
            } finally {
                if (mounted) setLoading(false);
            }
        };
        void getCustomerDashboard();
        return () => {
            mounted = false;
        };
    }, [apiFetch]);

    return { data, loading, error };
}
