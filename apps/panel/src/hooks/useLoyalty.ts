import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useMutationToast } from '@/hooks/useMutationToast';
import type {
    LoyaltyProgram,
    LoyaltyBalance,
    LoyaltyTransaction,
    LoyaltyReward,
    LoyaltyRewardRedemption,
    LoyaltyStats,
    UpdateLoyaltyProgramRequest,
    CreateRewardRequest,
    UpdateRewardRequest,
    AwardPointsRequest,
    AdjustPointsRequest,
    RedeemRewardRequest,
    UseCouponRequest,
    LoyaltyTransactionQueryParams,
    RewardQueryParams,
} from '@/types';

export const LOYALTY_QUERY_KEY = ['api', '/loyalty'] as const;

// Program
export function useLoyaltyProgram() {
    const { apiFetch } = useAuth();

    return useQuery({
        queryKey: [...LOYALTY_QUERY_KEY, 'program'],
        queryFn: async () => {
            return apiFetch<LoyaltyProgram>('/loyalty/program');
        },
    });
}

function useInvalidateLoyalty() {
    const queryClient = useQueryClient();
    return () => {
        void queryClient.invalidateQueries({ queryKey: LOYALTY_QUERY_KEY });
    };
}

export function useUpdateLoyaltyProgram() {
    const { apiFetch } = useAuth();
    const invalidate = useInvalidateLoyalty();
    const toast = useMutationToast();

    return useMutation({
        mutationFn: async (data: UpdateLoyaltyProgramRequest) => {
            return apiFetch<LoyaltyProgram>('/loyalty/program', {
                method: 'PUT',
                body: JSON.stringify(data),
            });
        },
        ...toast.feedback(
            'Program lojalnościowy zapisany',
            'Nie udało się zapisać programu',
            invalidate,
        ),
    });
}

// Statistics
export function useLoyaltyStats() {
    const { apiFetch } = useAuth();

    return useQuery({
        queryKey: [...LOYALTY_QUERY_KEY, 'stats'],
        queryFn: async () => {
            return apiFetch<LoyaltyStats>('/loyalty/stats');
        },
    });
}

// Balance
export function useMyLoyaltyBalance() {
    const { apiFetch } = useAuth();

    return useQuery({
        queryKey: [...LOYALTY_QUERY_KEY, 'balance', 'me'],
        queryFn: async () => {
            return apiFetch<LoyaltyBalance>('/loyalty/balance/me');
        },
    });
}

export function useUserLoyaltyBalance(userId: number | null) {
    const { apiFetch } = useAuth();

    return useQuery({
        queryKey: [...LOYALTY_QUERY_KEY, 'balance', userId],
        queryFn: async () => {
            return apiFetch<LoyaltyBalance>(`/loyalty/balance/${userId}`);
        },
        enabled: userId !== null,
    });
}

// Transactions
export function useMyLoyaltyTransactions() {
    const { apiFetch } = useAuth();

    return useQuery({
        queryKey: [...LOYALTY_QUERY_KEY, 'transactions', 'me'],
        queryFn: async () => {
            return apiFetch<LoyaltyTransaction[]>('/loyalty/transactions/me');
        },
    });
}

export function useLoyaltyTransactions(params?: LoyaltyTransactionQueryParams) {
    const { apiFetch } = useAuth();

    return useQuery({
        queryKey: [...LOYALTY_QUERY_KEY, 'transactions', params],
        queryFn: async () => {
            const searchParams = new URLSearchParams();
            if (params?.userId)
                searchParams.append('userId', String(params.userId));
            if (params?.type) searchParams.append('type', params.type);
            if (params?.source) searchParams.append('source', params.source);
            if (params?.from) searchParams.append('from', params.from);
            if (params?.to) searchParams.append('to', params.to);
            if (params?.page) searchParams.append('page', String(params.page));
            if (params?.limit)
                searchParams.append('limit', String(params.limit));
            const query = searchParams.toString();
            return apiFetch<{ data: LoyaltyTransaction[]; total: number }>(
                `/loyalty/transactions${query ? `?${query}` : ''}`,
            );
        },
    });
}

// Points Operations
export function useAwardPoints() {
    const { apiFetch } = useAuth();
    const invalidate = useInvalidateLoyalty();
    const toast = useMutationToast();

    return useMutation({
        mutationFn: async (data: AwardPointsRequest) => {
            return apiFetch<LoyaltyTransaction>('/loyalty/points/award', {
                method: 'POST',
                body: JSON.stringify(data),
            });
        },
        ...toast.feedback(
            'Punkty przyznane',
            'Nie udało się przyznać punktów',
            invalidate,
        ),
    });
}

export function useAdjustPoints() {
    const { apiFetch } = useAuth();
    const invalidate = useInvalidateLoyalty();
    const toast = useMutationToast();

    return useMutation({
        mutationFn: async ({
            userId,
            data,
        }: {
            userId: number;
            data: AdjustPointsRequest;
        }) => {
            return apiFetch<LoyaltyTransaction>(
                `/loyalty/points/${userId}/adjust`,
                {
                    method: 'POST',
                    body: JSON.stringify(data),
                },
            );
        },
        ...toast.feedback(
            'Saldo punktów zaktualizowane',
            'Nie udało się zaktualizować salda',
            invalidate,
        ),
    });
}

// Rewards
export function useLoyaltyRewards(params?: RewardQueryParams) {
    const { apiFetch } = useAuth();

    return useQuery({
        queryKey: [...LOYALTY_QUERY_KEY, 'rewards', params],
        queryFn: async () => {
            const searchParams = new URLSearchParams();
            if (params?.type) searchParams.append('type', params.type);
            if (params?.isActive !== undefined)
                searchParams.append('isActive', String(params.isActive));
            if (params?.page) searchParams.append('page', String(params.page));
            if (params?.limit)
                searchParams.append('limit', String(params.limit));
            const query = searchParams.toString();
            return apiFetch<{ data: LoyaltyReward[]; total: number }>(
                `/loyalty/rewards${query ? `?${query}` : ''}`,
            );
        },
    });
}

export function useAvailableRewards() {
    const { apiFetch } = useAuth();

    return useQuery({
        queryKey: [...LOYALTY_QUERY_KEY, 'rewards', 'available'],
        queryFn: async () => {
            return apiFetch<LoyaltyReward[]>('/loyalty/rewards/available');
        },
    });
}

export function useLoyaltyReward(id: number | null) {
    const { apiFetch } = useAuth();

    return useQuery({
        queryKey: [...LOYALTY_QUERY_KEY, 'rewards', id],
        queryFn: async () => {
            return apiFetch<LoyaltyReward>(`/loyalty/rewards/${id}`);
        },
        enabled: id !== null,
    });
}

export function useCreateReward() {
    const { apiFetch } = useAuth();
    const invalidate = useInvalidateLoyalty();
    const toast = useMutationToast();

    return useMutation({
        mutationFn: async (data: CreateRewardRequest) => {
            return apiFetch<LoyaltyReward>('/loyalty/rewards', {
                method: 'POST',
                body: JSON.stringify(data),
            });
        },
        ...toast.feedback(
            'Nagroda dodana',
            'Nie udało się dodać nagrody',
            invalidate,
        ),
    });
}

export function useUpdateReward() {
    const { apiFetch } = useAuth();
    const invalidate = useInvalidateLoyalty();
    const toast = useMutationToast();

    return useMutation({
        mutationFn: async ({
            id,
            data,
        }: {
            id: number;
            data: UpdateRewardRequest;
        }) => {
            return apiFetch<LoyaltyReward>(`/loyalty/rewards/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data),
            });
        },
        ...toast.feedback(
            'Nagroda zapisana',
            'Nie udało się zapisać nagrody',
            invalidate,
        ),
    });
}

export function useDeleteReward() {
    const { apiFetch } = useAuth();
    const invalidate = useInvalidateLoyalty();
    const toast = useMutationToast();

    return useMutation({
        mutationFn: async (id: number) => {
            return apiFetch<void>(`/loyalty/rewards/${id}`, {
                method: 'DELETE',
            });
        },
        ...toast.feedback(
            'Nagroda usunięta',
            'Nie udało się usunąć nagrody',
            invalidate,
        ),
    });
}

// Redemption
export function useRedeemReward() {
    const { apiFetch } = useAuth();
    const invalidate = useInvalidateLoyalty();
    const toast = useMutationToast();

    return useMutation({
        mutationFn: async (data: RedeemRewardRequest) => {
            return apiFetch<LoyaltyRewardRedemption>('/loyalty/redeem', {
                method: 'POST',
                body: JSON.stringify(data),
            });
        },
        ...toast.feedback(
            'Nagroda zrealizowana',
            'Nie udało się zrealizować nagrody',
            invalidate,
        ),
    });
}

export function useRedeemRewardForUser() {
    const { apiFetch } = useAuth();
    const invalidate = useInvalidateLoyalty();
    const toast = useMutationToast();

    return useMutation({
        mutationFn: async ({
            userId,
            data,
        }: {
            userId: number;
            data: RedeemRewardRequest;
        }) => {
            return apiFetch<LoyaltyRewardRedemption>(
                `/loyalty/redeem/${userId}`,
                {
                    method: 'POST',
                    body: JSON.stringify(data),
                },
            );
        },
        ...toast.feedback(
            'Nagroda zrealizowana dla klienta',
            'Nie udało się zrealizować nagrody',
            invalidate,
        ),
    });
}

export function useUseCoupon() {
    const { apiFetch } = useAuth();
    const invalidate = useInvalidateLoyalty();
    const toast = useMutationToast();

    return useMutation({
        mutationFn: async (data: UseCouponRequest) => {
            return apiFetch<LoyaltyRewardRedemption>('/loyalty/use-coupon', {
                method: 'POST',
                body: JSON.stringify(data),
            });
        },
        ...toast.feedback(
            'Kupon zrealizowany',
            'Nie udało się zrealizować kuponu',
            invalidate,
        ),
    });
}

// Redemptions
export function useMyRedemptions() {
    const { apiFetch } = useAuth();

    return useQuery({
        queryKey: [...LOYALTY_QUERY_KEY, 'redemptions', 'me'],
        queryFn: async () => {
            return apiFetch<LoyaltyRewardRedemption[]>(
                '/loyalty/redemptions/me',
            );
        },
    });
}

export function useUserRedemptions(userId: number | null) {
    const { apiFetch } = useAuth();

    return useQuery({
        queryKey: [...LOYALTY_QUERY_KEY, 'redemptions', userId],
        queryFn: async () => {
            return apiFetch<LoyaltyRewardRedemption[]>(
                `/loyalty/redemptions/${userId}`,
            );
        },
        enabled: userId !== null,
    });
}
