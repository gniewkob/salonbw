import { useClientDashboard } from '@/hooks/useDashboard';
import StatsWidget from '@/components/StatsWidget';

export default function ClientDashboard() {
    const { data, loading, error } = useClientDashboard();

    if (loading) {
        return <div className="p-4">Loading dashboard...</div>;
    }

    if (error) {
        return (
            <div className="p-4 text-red-600">
                Error loading dashboard: {error.message}
            </div>
        );
    }

    if (!data) {
        return <div className="p-4">No data available</div>;
    }

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('pl-PL', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Your Dashboard</h1>

            {/* Upcoming Appointment */}
            <section className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">
                    Upcoming Appointment
                </h2>
                {data.upcomingAppointment ? (
                    <div className="border-l-4 border-blue-500 pl-4">
                        <p className="text-lg font-medium">
                            {data.upcomingAppointment.serviceName}
                        </p>
                        <p className="text-gray-600">
                            {formatDate(data.upcomingAppointment.startTime)}
                        </p>
                        <p className="text-sm text-gray-500">
                            with {data.upcomingAppointment.employeeName}
                        </p>
                    </div>
                ) : (
                    <p className="text-gray-500">
                        No upcoming appointments scheduled
                    </p>
                )}
            </section>

            {/* Stats */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <StatsWidget
                    title="Completed Appointments"
                    value={data.completedCount}
                    loading={false}
                />
                <StatsWidget
                    title="Services Used"
                    value={data.serviceHistory.length}
                    loading={false}
                />
            </section>

            {/* Service History */}
            <section className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">
                    Your Favorite Services
                </h2>
                {data.serviceHistory.length > 0 ? (
                    <ul className="space-y-2">
                        {data.serviceHistory.slice(0, 5).map((service) => (
                            <li
                                key={service.id}
                                className="flex justify-between items-center py-2 border-b last:border-0"
                            >
                                <span>{service.name}</span>
                                <span className="text-gray-500 text-sm">
                                    {service.count}{' '}
                                    {service.count === 1 ? 'visit' : 'visits'}
                                </span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-500">No service history yet</p>
                )}
            </section>

            {/* Recent Appointments */}
            <section className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">
                    Recent Appointments
                </h2>
                {data.recentAppointments.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-2">Service</th>
                                    <th className="text-left py-2">Date</th>
                                    <th className="text-left py-2">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.recentAppointments.map((apt) => (
                                    <tr key={apt.id} className="border-b">
                                        <td className="py-2">
                                            {apt.serviceName}
                                        </td>
                                        <td className="py-2">
                                            {new Date(
                                                apt.startTime,
                                            ).toLocaleDateString('pl-PL')}
                                        </td>
                                        <td className="py-2">
                                            <span
                                                className={`px-2 py-1 rounded text-xs ${
                                                    apt.status === 'completed'
                                                        ? 'bg-green-100 text-green-800'
                                                        : apt.status ===
                                                            'cancelled'
                                                          ? 'bg-red-100 text-red-800'
                                                          : 'bg-blue-100 text-blue-800'
                                                }`}
                                            >
                                                {apt.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-gray-500">No appointments yet</p>
                )}
            </section>
        </div>
    );
}
