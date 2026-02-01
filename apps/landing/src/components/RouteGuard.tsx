import { useRouter } from 'next/router';
import { ReactNode, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Forbidden from '@/components/Forbidden';
import { can, type Permission } from '@/utils/access';
import type { Role } from '@/types';
import { getPanelUrl } from '@/utils/panelUrl';

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
            const loginUrl = `${getPanelUrl('/auth/login')}${redirectTo}`;
            const navigation = router.replace(loginUrl);
            if (navigation && typeof navigation.catch === 'function') {
                void navigation.catch(() => {
                    if (typeof window !== 'undefined') {
                        window.location.href = loginUrl;
                    }
                });
            } else if (typeof window !== 'undefined') {
                window.location.href = loginUrl;
            }
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
