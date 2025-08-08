import RouteGuard from '@/components/RouteGuard';
import DashboardLayout from '@/components/DashboardLayout';
import DashboardWidget from '@/components/DashboardWidget';
import { useDashboard } from '@/hooks/useDashboard';

export default function ClientDashboard() {
    const { data, loading } = useDashboard();
    return (
        <RouteGuard roles={['client']}>
            <DashboardLayout>
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                    <DashboardWidget
                        label="Upcoming"
                        value={data?.todayCount ?? null}
                        loading={loading}
                    />
                </div>
            </DashboardLayout>
        </RouteGuard>
    );
}
