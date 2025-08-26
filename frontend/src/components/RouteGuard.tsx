import { useRouter } from 'next/router';
import { ReactNode, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { Role } from '@/types';

interface Props {
    children: ReactNode;
    roles?: Role[];
}

export default function RouteGuard({ children, roles }: Props) {
    const { isAuthenticated, role, initialized } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!initialized) return;
        if (!isAuthenticated) {
            void router.replace('/auth/login');
        } else if (roles && role && !roles.includes(role)) {
            void router.replace(`/dashboard/${role}`);
        }
    }, [initialized, isAuthenticated, role, roles, router]);

    if (!initialized) return null;
    if (!isAuthenticated) return null;
    if (roles && role && !roles.includes(role)) return null;
    return <>{children}</>;
}
