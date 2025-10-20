import RouteGuard from '@/components/RouteGuard';
import DashboardLayout from '@/components/DashboardLayout';
import StatsWidget from '@/components/StatsWidget';
import { useDashboard } from '@/hooks/useDashboard';

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
