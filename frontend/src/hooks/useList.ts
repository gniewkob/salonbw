import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export function useList<T>(endpoint: string) {
  const { apiFetch } = useAuth();
  const [data, setData] = useState<T[] | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    apiFetch<T[]>(endpoint)
      .then((res) => {
        if (mounted) setData(res);
      })
      .catch((err) => {
        if (mounted) setError(err);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [endpoint, apiFetch]);

  return { data, error, loading };
}
