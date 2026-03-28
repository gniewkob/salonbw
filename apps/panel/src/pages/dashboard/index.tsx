import dynamic from 'next/dynamic';
import type { ComponentProps } from 'react';
import RouteGuard from '@/components/RouteGuard';
import SalonShell from '@/components/salon/SalonShell';
import { useAuth } from '@/contexts/AuthContext';

import type ClientDashboardComponent from '@/components/dashboard/ClientDashboard';
import type AdminDashboardComponent from '@/components/dashboard/AdminDashboard';

const ClientDashboard = dynamic<
    ComponentProps<typeof ClientDashboardComponent>
>(() => import('@/components/dashboard/ClientDashboard'), {
    ssr: false,
    loading: () => (
        <div className="p-4 small text-muted">Loading dashboard...</div>
    ),
});

const AdminDashboard = dynamic<ComponentProps<typeof AdminDashboardComponent>>(
    () => import('@/components/dashboard/AdminDashboard'),
    {
        ssr: false,
        loading: () => (
            <div className="p-4 small text-muted">Loading dashboard...</div>
        ),
    },
);

export default function DashboardPage() {
    const { role } = useAuth();

    if (!role) return null;

    const renderDashboard = () => {
        switch (role) {
            case 'client':
                return <ClientDashboard />;
            case 'admin':
                return <AdminDashboard />;
            case 'employee':
            case 'receptionist':
                return <AdminDashboard />;
            default:
                return <div>Please log in to view your dashboard</div>;
        }
    };

    return (
        <RouteGuard roles={['client', 'employee', 'receptionist', 'admin']}>
            <SalonShell role={role}>{renderDashboard()}</SalonShell>
        </RouteGuard>
    );
}
