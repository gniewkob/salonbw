import { useDashboard } from '@/hooks/useDashboard';
import StatsWidget from '@/components/StatsWidget';

export default function AdminDashboard() {
    const { data, loading } = useDashboard();

    if (loading) {
        return <div className="p-4">Loading dashboard...</div>;
    }

    if (!data) {
        return <div className="p-4">No data available</div>;
    }

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('pl-PL', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>

            {/* Stats Grid */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatsWidget
                    title="Total Clients"
                    value={data.clientCount}
                    loading={false}
                />
                <StatsWidget
                    title="Total Employees"
                    value={data.employeeCount}
                    loading={false}
                />
                <StatsWidget
                    title="Today's Appointments"
                    value={data.todayAppointments}
                    loading={false}
                />
            </section>

            {/* Upcoming Appointments */}
            <section className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">
                    Upcoming Appointments
                </h2>
                {data.upcomingAppointments.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-2">Client</th>
                                    <th className="text-left py-2">Service</th>
                                    <th className="text-left py-2">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.upcomingAppointments.map((apt) => (
                                    <tr key={apt.id} className="border-b">
                                        <td className="py-2">
                                            {apt.client?.name ?? 'Unknown'}
                                        </td>
                                        <td className="py-2">
                                            {apt.service?.name ?? 'Unknown'}
                                        </td>
                                        <td className="py-2">
                                            {formatDate(apt.startTime)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-gray-500">No upcoming appointments</p>
                )}
            </section>
        </div>
    );
}
