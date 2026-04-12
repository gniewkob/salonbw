import { useCustomerDashboard } from '@/hooks/useDashboard';
import StatsWidget from '@/components/StatsWidget';

const appointmentStatusLabel: Record<string, string> = {
    completed: 'zakończona',
    cancelled: 'anulowana',
    scheduled: 'zaplanowana',
    confirmed: 'potwierdzona',
};

export default function CustomerDashboard() {
    const { data, loading, error } = useCustomerDashboard();

    if (loading) {
        return <div className="p-3">Ładowanie panelu klienta...</div>;
    }

    if (error) {
        return (
            <div className="p-3 text-danger">
                Nie udało się wczytać panelu klienta: {error.message}
            </div>
        );
    }

    if (!data) {
        return <div className="p-3">Brak danych do wyświetlenia</div>;
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
            <h1 className="fs-3 fw-bold">Twój panel</h1>

            <section className="bg-white rounded-3 shadow p-4">
                <h2 className="fs-5 fw-semibold mb-3">Najbliższa wizyta</h2>
                {data.upcomingAppointment ? (
                    <div className="border-start-4 border-primary ps-3">
                        <p className="fs-5 fw-medium">
                            {data.upcomingAppointment.serviceName}
                        </p>
                        <p className="text-muted">
                            {formatDate(data.upcomingAppointment.startTime)}
                        </p>
                        <p className="small text-muted">
                            z pracownikiem:{' '}
                            {data.upcomingAppointment.employeeName}
                        </p>
                    </div>
                ) : (
                    <p className="text-muted">Brak zaplanowanych wizyt</p>
                )}
            </section>

            <section className="-cols-1 gap-3">
                <StatsWidget
                    title="Zakończone wizyty"
                    value={data.completedCount}
                    loading={false}
                />
                <StatsWidget
                    title="Wykorzystane usługi"
                    value={data.serviceHistory.length}
                    loading={false}
                />
            </section>

            <section className="bg-white rounded-3 shadow p-4">
                <h2 className="fs-5 fw-semibold mb-3">
                    Najczęściej wybierane usługi
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
                                    {service.count === 1 ? 'wizyta' : 'wizyty'}
                                </span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-muted">Brak historii usług</p>
                )}
            </section>

            <section className="bg-white rounded-3 shadow p-4">
                <h2 className="fs-5 fw-semibold mb-3">Ostatnie wizyty</h2>
                {data.recentAppointments.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-100 small">
                            <thead>
                                <tr className="border-bottom">
                                    <th className="text-start py-2">Usługa</th>
                                    <th className="text-start py-2">Data</th>
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
                                                {appointmentStatusLabel[
                                                    apt.status
                                                ] ?? apt.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-muted">Brak wizyt</p>
                )}
            </section>
        </div>
    );
}
