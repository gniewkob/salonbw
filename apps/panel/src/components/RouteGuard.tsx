import { useRouter } from 'next/router';
import { ReactNode, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Forbidden from '@/components/Forbidden';
import { can, type Permission } from '@/utils/access';
import { getPostLoginRoute } from '@/utils/postLoginRoute';
import type { Role } from '@/types';

interface Props {
    children: ReactNode;
    roles?: Role[];
    permission?: Permission;
    loadingFallback?: ReactNode;
}

export default function RouteGuard({
    children,
    roles,
    permission,
    loadingFallback = null,
}: Props) {
    const { isAuthenticated, role, initialized } = useAuth();
    const router = useRouter();
    const deniedByRole = Boolean(roles && role && !roles.includes(role));

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

    useEffect(() => {
        if (!initialized || !isAuthenticated || !role || !deniedByRole) {
            return;
        }
        const fallbackRoute = getPostLoginRoute(role);
        if (router.asPath !== fallbackRoute) {
            void router.replace(fallbackRoute);
        }
    }, [deniedByRole, initialized, isAuthenticated, role, router]);

    if (!initialized) return <>{loadingFallback}</>;
    if (!isAuthenticated) return null;

    if (deniedByRole) return null;

    if (permission && !can(role, permission)) {
        return <Forbidden />;
    }

    return <>{children}</>;
}
