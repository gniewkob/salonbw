import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Review } from '@/types';

export function useReviewApi() {
  const { apiFetch } = useAuth();
  const toast = useToast();

  const create = async (data: { reservationId: number; rating: number; comment?: string }) => {
    try {
      const res = await apiFetch<Review>('/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      toast.success('Review created');
      return res;
    } catch (err: any) {
      toast.error(err.message || 'Error');
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
    } catch (err: any) {
      toast.error(err.message || 'Error');
      throw err;
    }
  };

  const remove = async (id: number) => {
    try {
      await apiFetch<void>(`/reviews/${id}`, { method: 'DELETE' });
      toast.success('Review deleted');
    } catch (err: any) {
      toast.error(err.message || 'Error');
      throw err;
    }
  };

  return { create, update, remove };
}
