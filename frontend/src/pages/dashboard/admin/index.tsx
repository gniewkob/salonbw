import RouteGuard from '@/components/RouteGuard';
import DashboardLayout from '@/components/DashboardLayout';
import DashboardWidget from '@/components/DashboardWidget';
import { useDashboard } from '@/hooks/useDashboard';

export default function AdminDashboard() {
    const { data, loading } = useDashboard();
    return (
        <RouteGuard>
            <DashboardLayout>
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
            </DashboardLayout>
        </RouteGuard>
    );
}
