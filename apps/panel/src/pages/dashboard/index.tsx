import dynamic from 'next/dynamic';
import type { ComponentProps } from 'react';
import RouteGuard from '@/components/RouteGuard';
import SalonShell from '@/components/salon/SalonShell';
import { useAuth } from '@/contexts/AuthContext';

import type CustomerDashboardComponent from '@/components/dashboard/CustomerDashboard';
import type AdminDashboardComponent from '@/components/dashboard/AdminDashboard';

const CustomerDashboard = dynamic<
    ComponentProps<typeof CustomerDashboardComponent>
>(() => import('@/components/dashboard/CustomerDashboard'), {
    ssr: false,
    loading: () => (
        <div className="p-4 small text-muted">Ładowanie panelu...</div>
    ),
});

const AdminDashboard = dynamic<ComponentProps<typeof AdminDashboardComponent>>(
    () => import('@/components/dashboard/AdminDashboard'),
    {
        ssr: false,
        loading: () => (
            <div className="p-4 small text-muted">Ładowanie panelu...</div>
        ),
    },
);

export default function DashboardPage() {
    const { role } = useAuth();

    if (!role) return null;

    const renderDashboard = () => {
        switch (role) {
            case 'customer':
                return <CustomerDashboard />;
            case 'admin':
                return <AdminDashboard />;
            case 'employee':
            case 'receptionist':
                return <AdminDashboard />;
            default:
                return (
                    <div className="p-4 small text-muted">
                        Zaloguj się, aby zobaczyć swój panel.
                    </div>
                );
        }
    };

    return (
        <RouteGuard roles={['customer', 'employee', 'receptionist', 'admin']}>
            <SalonShell role={role}>{renderDashboard()}</SalonShell>
        </RouteGuard>
    );
}
