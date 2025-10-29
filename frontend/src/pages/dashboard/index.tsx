import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useQuery } from '@tanstack/react-query';
import { useApi } from '@/hooks/useApi';

export default function DashboardRedirect() {
    const router = useRouter();
    const api = useApi();

    const { data: profile, isError } = useQuery({
        queryKey: ['api', '/users/profile'],
        queryFn: () => api.request('/users/profile'),
    });

    useEffect(() => {
        if (profile?.role) {
            void router.replace(`/dashboard/${profile.role}`);
        } else if (isError) {
            // If there's an error fetching the role, redirect to client dashboard
            void router.replace('/dashboard/client');
        }
    }, [router, profile, isError]);

    return null;
}
