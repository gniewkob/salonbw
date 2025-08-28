import RouteGuard from '@/components/RouteGuard';
import DashboardLayout from '@/components/DashboardLayout';
import StatsWidget from '@/components/StatsWidget';
import { useDashboard } from '@/hooks/useDashboard';

export default function ReceptionistDashboard() {
    const { data, loading } = useDashboard();
    return (
        <RouteGuard roles={['receptionist']}>
            <DashboardLayout>
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                    <StatsWidget
                        title="All Appointments"
                        value={data?.todayCount ?? null}
                        loading={loading}
                    />
                </div>
            </DashboardLayout>
        </RouteGuard>
    );
}
