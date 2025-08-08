import RouteGuard from '@/components/RouteGuard';
import Layout from '@/components/Layout';
import DashboardWidget from '@/components/DashboardWidget';
import { useDashboard } from '@/hooks/useDashboard';

export default function AdminDashboard() {
    const { data, loading } = useDashboard();
    return (
        <RouteGuard roles={['admin']}>
            <Layout>
                <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                    <DashboardWidget
                        label="Clients"
                        value={data?.clientCount ?? null}
                        loading={loading}
                    />
                    <DashboardWidget
                        label="Employees"
                        value={data?.employeeCount ?? null}
                        loading={loading}
                    />
                    <DashboardWidget
                        label="Today"
                        value={data?.todayCount ?? null}
                        loading={loading}
                    />
                </div>
            </Layout>
        </RouteGuard>
    );
}
