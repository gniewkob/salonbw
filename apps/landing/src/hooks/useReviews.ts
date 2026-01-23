import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Review } from '@/types';

interface Options {
    employeeId?: number;
    clientId?: number;
    mine?: boolean;
}

export function useReviews(options: Options = {}) {
    const { apiFetch } = useAuth();
    const [data, setData] = useState<Review[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [rating, setRating] = useState<number | undefined>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const endpoint = options.employeeId
            ? `/employees/${options.employeeId}/reviews`
            : options.clientId
              ? `/clients/${options.clientId}/reviews`
              : options.mine
                ? '/reviews/me'
                : '/reviews';
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('limit', String(limit));
        if (rating) params.set('rating', String(rating));
        const qs = params.toString();
        setLoading(true);
        apiFetch<{
            data: Review[];
            total: number;
            page: number;
            limit: number;
        }>(`${endpoint}${qs ? `?${qs}` : ''}`)
            .then((res) => {
                setData(res.data);
                setTotal(res.total);
                setLimit(res.limit);
            })
            .catch((err: unknown) =>
                setError(err instanceof Error ? err : new Error(String(err))),
            )
            .finally(() => setLoading(false));
    }, [options.employeeId, options.clientId, options.mine, page, limit, rating, apiFetch]);

    return {
        data,
        total,
        page,
        limit,
        rating,
        setPage,
        setRating,
        loading,
        error,
    };
}
