import type { Route } from 'next';
import dynamic from 'next/dynamic';
import type { ComponentProps } from 'react';
import RouteGuard from '@/components/RouteGuard';
import DashboardLayout from '@/components/DashboardLayout';
import { useDashboard } from '@/hooks/useDashboard';
import type AppointmentListItemComponent from '@/components/AppointmentListItem';

const StatsWidget = dynamic(() => import('@/components/StatsWidget'), {
    loading: () => (
        <div className="w-full rounded bg-white p-4 shadow">
            <div className="h-4 w-16 rounded bg-gray-100 animate-pulse" />
            <div className="mt-2 h-6 rounded bg-gray-100 animate-pulse" />
        </div>
    ),
});

const ShortcutCard = dynamic(() => import('@/components/ShortcutCard'), {
    loading: () => (
        <div className="flex h-20 items-center justify-center rounded border border-dashed bg-white text-gray-400">
            Loading…
        </div>
    ),
});

type AppointmentListItemProps = ComponentProps<
    typeof AppointmentListItemComponent
>;

const AppointmentListItem = dynamic<AppointmentListItemProps>(
    () => import('@/components/AppointmentListItem'),
    {
        loading: () => (
            <li className="rounded border border-dashed bg-white p-3 text-sm text-gray-500">
                Loading appointment…
            </li>
        ),
    },
);

export default function AdminDashboard() {
    const { data, loading, upcoming } = useDashboard();
    return (
        <RouteGuard roles={['admin']} permission="dashboard:admin">
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
                        href={'/employees' as Route}
                        icon="👥"
                        label="Employees"
                    />
                    <ShortcutCard
                        href={'/services' as Route}
                        icon="✂️"
                        label="Services"
                    />
                    <ShortcutCard
                        href={'/appointments' as Route}
                        icon="📅"
                        label="Appointments"
                    />
                    <ShortcutCard
                        href={'/clients' as Route}
                        icon="🧑"
                        label="Clients"
                    />
                    <ShortcutCard
                        href={'/products' as Route}
                        icon="🛍️"
                        label="Products"
                    />
                    <ShortcutCard
                        href={'/dashboard/admin/retail' as Route}
                        icon="🏪"
                        label="Retail"
                    />
                    <ShortcutCard
                        href={'/dashboard/admin/scheduler' as Route}
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
