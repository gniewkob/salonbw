import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useMutationToast } from '@/hooks/useMutationToast';
import type {
    GiftCard,
    GiftCardStats,
    GiftCardTransaction,
    GiftCardValidation,
    GiftCardQueryParams,
    CreateGiftCardRequest,
    UpdateGiftCardRequest,
    RedeemGiftCardRequest,
    AdjustGiftCardBalanceRequest,
} from '@/types';

export const GIFT_CARDS_QUERY_KEY = ['api', '/gift-cards'] as const;

export function useGiftCards(params?: GiftCardQueryParams) {
    const { apiFetch } = useAuth();

    return useQuery({
        queryKey: [...GIFT_CARDS_QUERY_KEY, params],
        queryFn: async () => {
            const searchParams = new URLSearchParams();
            if (params?.status) searchParams.append('status', params.status);
            if (params?.recipientId)
                searchParams.append('recipientId', String(params.recipientId));
            if (params?.purchasedById)
                searchParams.append(
                    'purchasedById',
                    String(params.purchasedById),
                );
            if (params?.code) searchParams.append('code', params.code);
            if (params?.page) searchParams.append('page', String(params.page));
            if (params?.limit)
                searchParams.append('limit', String(params.limit));
            const query = searchParams.toString();
            return apiFetch<{ data: GiftCard[]; total: number }>(
                `/gift-cards${query ? `?${query}` : ''}`,
            );
        },
    });
}

export function useGiftCard(id: number | null) {
    const { apiFetch } = useAuth();

    return useQuery({
        queryKey: [...GIFT_CARDS_QUERY_KEY, id],
        queryFn: async () => {
            return apiFetch<GiftCard>(`/gift-cards/${id}`);
        },
        enabled: id !== null,
    });
}

export function useGiftCardByCode(code: string | null) {
    const { apiFetch } = useAuth();

    return useQuery({
        queryKey: [...GIFT_CARDS_QUERY_KEY, 'code', code],
        queryFn: async () => {
            return apiFetch<GiftCard>(`/gift-cards/code/${code}`);
        },
        enabled: code !== null && code.length > 0,
    });
}

export function useGiftCardStats() {
    const { apiFetch } = useAuth();

    return useQuery({
        queryKey: [...GIFT_CARDS_QUERY_KEY, 'stats'],
        queryFn: async () => {
            return apiFetch<GiftCardStats>('/gift-cards/stats');
        },
    });
}

export function useGiftCardTransactions(giftCardId: number | null) {
    const { apiFetch } = useAuth();

    return useQuery({
        queryKey: [...GIFT_CARDS_QUERY_KEY, giftCardId, 'transactions'],
        queryFn: async () => {
            return apiFetch<GiftCardTransaction[]>(
                `/gift-cards/${giftCardId}/transactions`,
            );
        },
        enabled: giftCardId !== null,
    });
}

export function useValidateGiftCard(
    code: string | null,
    amount?: number,
    serviceId?: number,
) {
    const { apiFetch } = useAuth();

    return useQuery({
        queryKey: [
            ...GIFT_CARDS_QUERY_KEY,
            'validate',
            code,
            amount,
            serviceId,
        ],
        queryFn: async () => {
            const searchParams = new URLSearchParams();
            if (amount) searchParams.append('amount', String(amount));
            if (serviceId) searchParams.append('serviceId', String(serviceId));
            const query = searchParams.toString();
            return apiFetch<GiftCardValidation>(
                `/gift-cards/validate/${code}${query ? `?${query}` : ''}`,
            );
        },
        enabled: code !== null && code.length > 0,
    });
}

function useInvalidateGiftCards() {
    const queryClient = useQueryClient();
    return () => {
        void queryClient.invalidateQueries({ queryKey: GIFT_CARDS_QUERY_KEY });
    };
}

export function useCreateGiftCard() {
    const { apiFetch } = useAuth();
    const invalidate = useInvalidateGiftCards();
    const toast = useMutationToast();

    return useMutation({
        mutationFn: async (data: CreateGiftCardRequest) => {
            return apiFetch<GiftCard>('/gift-cards', {
                method: 'POST',
                body: JSON.stringify(data),
            });
        },
        ...toast.feedback(
            'Karta podarunkowa wystawiona',
            'Nie udało się wystawić karty podarunkowej',
            invalidate,
        ),
    });
}

export function useUpdateGiftCard() {
    const { apiFetch } = useAuth();
    const invalidate = useInvalidateGiftCards();
    const toast = useMutationToast();

    return useMutation({
        mutationFn: async ({
            id,
            data,
        }: {
            id: number;
            data: UpdateGiftCardRequest;
        }) => {
            return apiFetch<GiftCard>(`/gift-cards/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data),
            });
        },
        ...toast.feedback(
            'Karta podarunkowa zapisana',
            'Nie udało się zapisać karty podarunkowej',
            invalidate,
        ),
    });
}

export function useRedeemGiftCard() {
    const { apiFetch } = useAuth();
    const invalidate = useInvalidateGiftCards();
    const toast = useMutationToast();

    return useMutation({
        mutationFn: async (data: RedeemGiftCardRequest) => {
            return apiFetch<GiftCard>('/gift-cards/redeem', {
                method: 'POST',
                body: JSON.stringify(data),
            });
        },
        ...toast.feedback(
            'Karta podarunkowa zrealizowana',
            'Nie udało się zrealizować karty podarunkowej',
            invalidate,
        ),
    });
}

export function useAdjustGiftCardBalance() {
    const { apiFetch } = useAuth();
    const invalidate = useInvalidateGiftCards();
    const toast = useMutationToast();

    return useMutation({
        mutationFn: async ({
            id,
            data,
        }: {
            id: number;
            data: AdjustGiftCardBalanceRequest;
        }) => {
            return apiFetch<GiftCard>(`/gift-cards/${id}/adjust`, {
                method: 'POST',
                body: JSON.stringify(data),
            });
        },
        ...toast.feedback(
            'Saldo karty podarunkowej zaktualizowane',
            'Nie udało się zaktualizować salda',
            invalidate,
        ),
    });
}

export function useCancelGiftCard() {
    const { apiFetch } = useAuth();
    const invalidate = useInvalidateGiftCards();
    const toast = useMutationToast();

    return useMutation({
        mutationFn: async ({ id, reason }: { id: number; reason?: string }) => {
            return apiFetch<GiftCard>(`/gift-cards/${id}`, {
                method: 'DELETE',
                body: JSON.stringify({ reason }),
            });
        },
        ...toast.feedback(
            'Karta podarunkowa anulowana',
            'Nie udało się anulować karty podarunkowej',
            invalidate,
        ),
    });
}
