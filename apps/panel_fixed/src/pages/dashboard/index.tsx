import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useQuery } from '@tanstack/react-query';
import { useApi } from '@/hooks/useApi';

export default function DashboardRedirect() {
    const router = useRouter();
    const api = useApi();

    const { data: profile, isError } = useQuery<{ role?: string }>({
        queryKey: ['api', '/users/profile'],
        queryFn: () => api.request<{ role?: string }>('/users/profile'),
    });

    // Ensure TS sees the expected shape when build type-check runs
    const typedProfile = profile as { role?: string } | undefined;

    useEffect(() => {
        if (typedProfile?.role) {
            void router.replace(`/dashboard/${typedProfile.role}`);
        } else if (isError) {
            // If there's an error fetching the role, redirect to client dashboard
            void router.replace('/dashboard/client');
        }
    }, [router, typedProfile, isError]);

    return null;
}
