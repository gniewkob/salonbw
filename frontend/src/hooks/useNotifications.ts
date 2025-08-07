import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Notification } from '@/types';

export function useNotifications() {
  const { apiFetch } = useAuth();
  const [data, setData] = useState<Notification[]>([]);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let active = true;
    const fetchData = () => {
      void apiFetch<Notification[]>('/notifications')
        .then((d) => active && setData(d))
        .catch((e) => active && setError(e));
    };
    fetchData();
    const id = setInterval(() => {
      fetchData();
    }, 30000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [apiFetch]);

  return { data, error };
}
