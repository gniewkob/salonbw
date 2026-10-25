import Head from 'next/head';
import dynamic from 'next/dynamic';
import type { ComponentProps } from 'react';
import RouteGuard from '@/components/RouteGuard';
import SalonShell from '@/components/salon/SalonShell';
import { useAuth } from '@/contexts/AuthContext';

import type ClientDashboardComponent from '@/components/dashboard/ClientDashboard';
import type AdminDashboardComponent from '@/components/dashboard/AdminDashboard';
import type SystemDashboardComponent from '@/components/dashboard/SystemDashboard';

const SystemDashboard = dynamic<
    ComponentProps<typeof SystemDashboardComponent>
>(() => import('@/components/dashboard/SystemDashboard'), {
    ssr: false,
    loading: () => <div className="p-3">Ładowanie stanu systemu...</div>,
});

const ClientDashboard = dynamic<
    ComponentProps<typeof ClientDashboardComponent>
>(() => import('@/components/dashboard/ClientDashboard'), {
    ssr: false,
    loading: () => <div className="text-muted p-3">Ładowanie pulpitu...</div>,
});

const AdminDashboard = dynamic<ComponentProps<typeof AdminDashboardComponent>>(
    () => import('@/components/dashboard/AdminDashboard'),
    {
        ssr: false,
        loading: () => (
            <div className="text-muted p-3">Ładowanie pulpitu...</div>
        ),
    },
);

export default function DashboardPage() {
    const { role, user } = useAuth();

    const renderDashboard = () => {
        switch (role) {
            case 'client':
                return <ClientDashboard />;
            case 'admin':
                return user?.isSystemAdmin ? (
                    <SystemDashboard />
                ) : (
                    <AdminDashboard />
                );
            case 'employee':
            case 'receptionist':
                return <AdminDashboard />;
            default:
                return null;
        }
    };

    return (
        <RouteGuard roles={['client', 'employee', 'receptionist', 'admin']}>
            <Head>
                <title>Pulpit — Salon Black &amp; White</title>
            </Head>
            <SalonShell role={role}>{renderDashboard()}</SalonShell>
        </RouteGuard>
    );
}
