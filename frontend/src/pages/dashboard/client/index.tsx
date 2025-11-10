import dynamic from 'next/dynamic';
import RouteGuard from '@/components/RouteGuard';
import DashboardLayout from '@/components/DashboardLayout';
import { useDashboard } from '@/hooks/useDashboard';

const StatsWidget = dynamic(() => import('@/components/StatsWidget'), {
    loading: () => (
        <div className="w-full rounded bg-white p-4 shadow">
            <div className="h-4 w-24 rounded bg-gray-100 animate-pulse" />
            <div className="mt-2 h-6 rounded bg-gray-100 animate-pulse" />
        </div>
    ),
});

export default function ClientDashboard() {
    const { data, loading } = useDashboard();
    return (
        <RouteGuard roles={['client']} permission="dashboard:client">
            <DashboardLayout>
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                    <StatsWidget
                        title="Upcoming"
                        value={data?.todayAppointments ?? null}
                        loading={loading}
                    />
                </div>
            </DashboardLayout>
        </RouteGuard>
    );
}
