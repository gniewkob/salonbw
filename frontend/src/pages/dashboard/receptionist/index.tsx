import RouteGuard from '@/components/RouteGuard';
import Layout from '@/components/Layout';
import DashboardWidget from '@/components/DashboardWidget';
import { useDashboard } from '@/hooks/useDashboard';

export default function ReceptionistDashboard() {
    const { data, loading } = useDashboard();
    return (
        <RouteGuard roles={['receptionist']}>
            <Layout>
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                    <DashboardWidget
                        label="All Appointments"
                        value={data?.todayCount ?? null}
                        loading={loading}
                    />
                </div>
            </Layout>
        </RouteGuard>
    );
}
