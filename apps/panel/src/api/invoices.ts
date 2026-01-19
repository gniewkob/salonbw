import { useAuth } from '@/contexts/AuthContext';

export function useInvoicesApi() {
    const { apiFetch } = useAuth();

    const generate = async (reservationId: number) => {
        const res = await apiFetch('/invoices/generate/' + reservationId, {
            method: 'POST',
        });
        return res;
    };

    return { generate };
}
