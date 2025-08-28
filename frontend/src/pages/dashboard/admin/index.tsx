import RouteGuard from '@/components/RouteGuard';
import DashboardLayout from '@/components/DashboardLayout';
import StatsWidget from '@/components/StatsWidget';
import { useDashboard } from '@/hooks/useDashboard';
import AppointmentListItem from '@/components/AppointmentListItem';
import ShortcutCard from '@/components/ShortcutCard';

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
                        value={data?.todayAppointments ?? null}
                        loading={loading}
                    />
                </div>
                <div className="mt-4 grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
                    <ShortcutCard
                        href="/employees"
                        icon="👥"
                        label="Employees"
                    />
                    <ShortcutCard href="/services" icon="✂️" label="Services" />
                    <ShortcutCard
                        href="/appointments"
                        icon="📅"
                        label="Appointments"
                    />
                    <ShortcutCard href="/clients" icon="🧑" label="Clients" />
                    <ShortcutCard href="/products" icon="🛍️" label="Products" />
                    <ShortcutCard
                        href="/dashboard/admin/scheduler"
                        icon="🗓️"
                        label="Scheduler"
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
