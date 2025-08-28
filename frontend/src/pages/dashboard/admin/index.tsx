import RouteGuard from '@/components/RouteGuard';
import DashboardLayout from '@/components/DashboardLayout';
import StatsWidget from '@/components/StatsWidget';
import { useDashboard } from '@/hooks/useDashboard';
import AppointmentListItem from '@/components/AppointmentListItem';

export default function AdminDashboard() {
    const { data, loading, upcoming } = useDashboard();
    return (
        <RouteGuard roles={['admin']}>
            <DashboardLayout>
                <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                    <StatsWidget
                        title="Clients"
                        value={data?.clientCount ?? null}
                        loading={loading}
                    />
                    <StatsWidget
                        title="Employees"
                        value={data?.employeeCount ?? null}
                        loading={loading}
                    />
                    <StatsWidget
                        title="Today"
                        value={data?.todayCount ?? null}
                        loading={loading}
                    />
                </div>
                <ul className="mt-4 space-y-2">
                    {upcoming.slice(0, 5).map((a) => (
                        <AppointmentListItem key={a.id} appointment={a} />
                    ))}
                </ul>
            </DashboardLayout>
        </RouteGuard>
    );
}
