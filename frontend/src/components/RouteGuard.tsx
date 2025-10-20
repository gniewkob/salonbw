import { useRouter } from 'next/router';
import { ReactNode, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Forbidden from '@/components/Forbidden';
import { can, type Permission } from '@/utils/access';
import type { Role } from '@/types';

interface Props {
    children: ReactNode;
    roles?: Role[];
    permission?: Permission;
}

export default function RouteGuard({ children, roles, permission }: Props) {
    const { isAuthenticated, role, initialized } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!initialized) return;
        if (!isAuthenticated) {
            const redirectTo =
                router.asPath && router.asPath !== '/auth/login'
                    ? `?redirectTo=${encodeURIComponent(router.asPath)}`
                    : '';
            void router.replace(`/auth/login${redirectTo}`);
        }
    }, [initialized, isAuthenticated, router]);

    if (!initialized) return null;
    if (!isAuthenticated) return null;

    if (
        (roles && role && !roles.includes(role)) ||
        (permission && !can(role, permission))
    ) {
        return <Forbidden />;
    }

    return <>{children}</>;
}
