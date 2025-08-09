import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { EmailLog } from '@/types';

export function useEmails() {
    const { apiFetch } = useAuth();
    const [data, setData] = useState<EmailLog[]>([]);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        let active = true;
        const fetchData = async () => {
            try {
                const d = await apiFetch<EmailLog[]>('/emails');
                if (active) {
                    setData(d);
                }
            } catch (err: unknown) {
                if (active) {
                    setError(err instanceof Error ? err : new Error(String(err)));
                }
            }
        };
        void fetchData();
        const id = setInterval(() => {
            void fetchData();
        }, 30000);
        return () => {
            active = false;
            clearInterval(id);
        };
    }, [apiFetch]);

    return { data, error };
}
