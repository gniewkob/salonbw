import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import type { Role } from '@/types';

export default function DashboardRedirect() {
    const router = useRouter();
    const { role } = useAuth();
    useEffect(() => {
        const current: Role =
            role === 'client' ||
            role === 'employee' ||
            role === 'receptionist' ||
            role === 'admin'
                ? role
                : 'client';
        void router.replace(`/dashboard/${current}`).catch(() => {});
    }, [router, role]);
    return null;
}
