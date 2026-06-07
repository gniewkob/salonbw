import { useAuth } from '@/contexts/AuthContext';
import { Review } from '@/types';

export function useReviewApi() {
    const { apiFetch } = useAuth();

    const create = async (
        appointmentId: number,
        data: { rating: number; comment?: string },
    ) => {
        return apiFetch<Review>(`/appointments/${appointmentId}/review`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
    };

    const get = async (appointmentId: number) => {
        return apiFetch<Review>(`/appointments/${appointmentId}/review`);
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
        return apiFetch<{
            data: Review[];
            total: number;
            page: number;
            limit: number;
        }>(`/employees/${employeeId}/reviews${qs ? `?${qs}` : ''}`);
    };

    const update = async (
        id: number,
        data: { rating?: number; comment?: string },
    ) => {
        return apiFetch<Review>(`/reviews/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
    };

    const remove = async (id: number) => {
        await apiFetch(`/reviews/${id}`, { method: 'DELETE' });
    };

    return { create, get, listForEmployee, update, remove };
}
