import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Review } from '@/types';

export function useReviewApi() {
  const { apiFetch } = useAuth();
  const toast = useToast();

  const create = async (
    appointmentId: number,
    data: { rating: number; comment?: string },
  ) => {
    try {
      const res = await apiFetch<Review>(
        `/appointments/${appointmentId}/review`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        },
      );
      toast.success('Review created');
      return res;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error');
      throw err;
    }
  };

  const get = async (appointmentId: number) => {
    try {
      return await apiFetch<Review>(
        `/appointments/${appointmentId}/review`,
      );
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error');
      throw err;
    }
  };

  const listForEmployee = async (
    employeeId: number,
    params: { page?: number; limit?: number; rating?: number } = {},
  ) => {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.rating) query.set('rating', String(params.rating));
    const qs = query.toString();
    try {
      return await apiFetch<{ data: Review[]; total: number; page: number; limit: number }>(
        `/employees/${employeeId}/reviews${qs ? `?${qs}` : ''}`,
      );
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error');
      throw err;
    }
  };

  const update = async (id: number, data: { rating?: number; comment?: string }) => {
    try {
      const res = await apiFetch<Review>(`/reviews/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      toast.success('Review updated');
      return res;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error');
      throw err;
    }
  };

  const remove = async (id: number) => {
    try {
      await apiFetch(`/reviews/${id}`, { method: 'DELETE' });
      toast.success('Review deleted');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error');
      throw err;
    }
  };

  return { create, get, listForEmployee, update, remove };
}
