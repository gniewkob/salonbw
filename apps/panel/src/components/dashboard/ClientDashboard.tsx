import { useClientDashboard } from '@/hooks/useDashboard';
import StatsWidget from '@/components/StatsWidget';

export default function ClientDashboard() {
    const { data, loading, error } = useClientDashboard();

    if (loading) {
        return <div className="p-3">Loading dashboard...</div>;
    }

    if (error) {
        return (
            <div className="p-3 text-danger">
                Error loading dashboard: {error.message}
            </div>
        );
    }

    if (!data) {
        return <div className="p-3">No data available</div>;
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
        <div className="gap-3">
            <h1 className="fs-3 fw-bold">Your Dashboard</h1>

            {/* Upcoming Appointment */}
            <section className="bg-white rounded-3 shadow p-4">
                <h2 className="fs-5 fw-semibold mb-3">Upcoming Appointment</h2>
                {data.upcomingAppointment ? (
                    <div className="border-start-4 border-primary ps-3">
                        <p className="fs-5 fw-medium">
                            {data.upcomingAppointment.serviceName}
                        </p>
                        <p className="text-muted">
                            {formatDate(data.upcomingAppointment.startTime)}
                        </p>
                        <p className="small text-muted">
                            with {data.upcomingAppointment.employeeName}
                        </p>
                    </div>
                ) : (
                    <p className="text-muted">
                        No upcoming appointments scheduled
                    </p>
                )}
            </section>

            {/* Stats */}
            <section className="-cols-1 gap-3">
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
            <section className="bg-white rounded-3 shadow p-4">
                <h2 className="fs-5 fw-semibold mb-3">
                    Your Favorite Services
                </h2>
                {data.serviceHistory.length > 0 ? (
                    <ul className="gap-2">
                        {data.serviceHistory.slice(0, 5).map((service) => (
                            <li
                                key={service.id}
                                className="d-flex justify-content-between align-items-center py-2 border-bottom last:border-0"
                            >
                                <span>{service.name}</span>
                                <span className="text-muted small">
                                    {service.count}{' '}
                                    {service.count === 1 ? 'visit' : 'visits'}
                                </span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-muted">No service history yet</p>
                )}
            </section>

            {/* Recent Appointments */}
            <section className="bg-white rounded-3 shadow p-4">
                <h2 className="fs-5 fw-semibold mb-3">Recent Appointments</h2>
                {data.recentAppointments.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-100 small">
                            <thead>
                                <tr className="border-bottom">
                                    <th className="text-start py-2">Service</th>
                                    <th className="text-start py-2">Date</th>
                                    <th className="text-start py-2">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.recentAppointments.map((apt) => (
                                    <tr key={apt.id} className="border-bottom">
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
                                                className={`px-2 py-1 rounded small ${
                                                    apt.status === 'completed'
                                                        ? 'bg-success bg-opacity-10 text-success'
                                                        : apt.status ===
                                                            'cancelled'
                                                          ? 'bg-danger bg-opacity-10 text-danger'
                                                          : 'bg-primary bg-opacity-10 text-primary'
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
                    <p className="text-muted">No appointments yet</p>
                )}
            </section>
        </div>
    );
}
