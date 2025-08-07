import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Appointment, DashboardResponse } from '@/types';

export interface DashboardData extends DashboardResponse {}

export function useDashboard() {
  const { apiFetch } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    void apiFetch<DashboardData>('/dashboard')
      .then((d) => mounted && setData(d))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [apiFetch]);

  return { data, loading };
}
