import { useEffect } from 'react';
import type { Route } from 'next';
import { useRouter } from 'next/router';
import RouteGuard from '@/components/RouteGuard';
import { useAuth } from '@/contexts/AuthContext';
import type { Role } from '@/types';

const fallbackRoute = '/appointments' as Route;

const homeByRole: Record<Role, Route> = {
    client: '/appointments' as Route,
    employee: '/appointments' as Route,
    receptionist: '/appointments' as Route,
    admin: '/appointments' as Route,
};

export default function DashboardRoleRedirect() {
    const router = useRouter();
    const { role, initialized } = useAuth();

    useEffect(() => {
        if (!initialized || !role) return;
        const destination = homeByRole[role] ?? fallbackRoute;
        if (router.asPath !== destination) {
            void router.replace(destination);
        }
    }, [initialized, role, router]);

    return (
        <RouteGuard roles={['client', 'employee', 'receptionist', 'admin']}>
            <div className="p-4 text-sm text-gray-500">Redirecting...</div>
        </RouteGuard>
    );
}
