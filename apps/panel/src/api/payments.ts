import { useAuth } from '@/contexts/AuthContext';

export function usePaymentsApi() {
    const { apiFetch } = useAuth();

    const createSession = async (appointmentId: number) => {
        const res = await apiFetch<{ url: string }>(
            '/payments/create-session',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ appointmentId }),
            },
        );
        return res.url;
    };

    return { createSession };
}
