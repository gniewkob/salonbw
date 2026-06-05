
import { useState } from 'react';
import Link from 'next/link';
import { useClientDashboard } from '@/hooks/useDashboard';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import type { Formula } from '@/types';
const STATUS_LABELS: Record<string, string> = {
    scheduled: 'Zaplanowana',
    confirmed: 'Potwierdzona',
    in_progress: 'W trakcie',
    completed: 'Zrealizowana',
    cancelled: 'Anulowana',
    no_show: 'Nieobecność',
    online_pending: 'Oczekuje',
    rescheduled_pending: 'Zmiana terminu',
};

const STATUS_CLASS: Record<string, string> = {
    scheduled: 'badge bg-secondary',
    confirmed: 'badge bg-primary',
    in_progress: 'badge bg-warning text-dark',
    completed: 'badge bg-success',
    cancelled: 'badge bg-danger',
    no_show: 'badge bg-dark',
    online_pending: 'badge bg-warning text-dark',
    rescheduled_pending: 'badge bg-info text-dark',
};

function statusLabel(status: string) {
    return STATUS_LABELS[status] ?? status;
}

function statusClass(status: string) {
    return STATUS_CLASS[status] ?? 'badge bg-secondary';
}

const CANCELLABLE = new Set([
    'scheduled',
    'confirmed',
    'online_pending',
    'rescheduled_pending',
]);

export default function ClientDashboard() {
    const { data, loading, error, refetch } = useClientDashboard();
    const { apiFetch } = useAuth();
    const toast = useToast();
    const [cancelling, setCancelling] = useState<Set<number>>(new Set());
    const [accepting, setAccepting] = useState<Set<number>>(new Set());

    const cancelAppointment = async (id: number) => {
        if (!confirm('Czy na pewno chcesz anulować tę wizytę?')) return;
        setCancelling((prev) => new Set(prev).add(id));
        try {
            await apiFetch(`/appointments/${id}/cancel`, {
                method: 'PATCH',
            });
            refetch();
        } catch {
            toast.error('Nie udało się anulować wizyty. Spróbuj ponownie.');
        } finally {
            setCancelling((prev) => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
    };

    const acceptReschedule = async (id: number) => {
        setAccepting((prev) => new Set(prev).add(id));
        try {
            await apiFetch(`/appointments/${id}/accept-reschedule`, {
                method: 'PATCH',
            });
            refetch();
        } catch {
            toast.error(
                'Nie udało się zaakceptować zmiany terminu. Spróbuj ponownie.',
            );
        } finally {
            setAccepting((prev) => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
    };

    if (loading) {
        return (
            <div className="salonbw-dashboard">
                <div className="salonbw-dashboard__loading">
                    Ładowanie pulpitu...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="salonbw-dashboard">
                <div className="alert alert-danger">
                    Błąd ładowania danych: {error.message}
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="salonbw-dashboard">
                <div className="salonbw-dashboard__empty">Brak danych</div>
            </div>
        );
    }

    const formatDate = (dateStr: string) =>
        new Date(dateStr).toLocaleDateString('pl-PL', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });

    return (
        <div className="salonbw-dashboard">
            <div className="salonbw-dashboard__header">
                <h1 className="salonbw-dashboard__title">Mój panel</h1>
                <Link href="/booking" className="btn btn-primary">
                    Zarezerwuj wizytę
                </Link>
            </div>

            {/* Nearest appointment */}
            <div className="salonbw-dashboard__grid">
                <div className="salonbw-dashboard__section">
                    <div className="salonbw-dashboard__section-header">
                        <h2>Nadchodząca wizyta</h2>
                    </div>
                    {data.upcomingAppointment ? (
                        <div className="salonbw-appointments-list">
                            <div className="salonbw-appointment-item salonbw-appointment-item--upcoming">
                                <div className="salonbw-appointment-item__details">
                                    <div className="salonbw-appointment-item__client">
                                        {data.upcomingAppointment.serviceName}
                                    </div>
                                    <div className="salonbw-appointment-item__service text-muted small">
                                        {formatDate(
                                            data.upcomingAppointment.startTime,
                                        )}
                                    </div>
                                    {data.upcomingAppointment.employeeName && (
                                        <div className="salonbw-appointment-item__service text-muted small">
                                            specjalista:{' '}
                                            {
                                                data.upcomingAppointment
                                                    .employeeName
                                            }
                                        </div>
                                    )}
                                </div>
                                <div className="d-flex align-items-center gap-2 flex-wrap">
                                    {data.upcomingAppointment.status && (
                                        <span
                                            className={statusClass(
                                                data.upcomingAppointment
                                                    .status ?? '',
                                            )}
                                        >
                                            {statusLabel(
                                                data.upcomingAppointment
                                                    .status ?? '',
                                            )}
                                        </span>
                                    )}
                                    {data.upcomingAppointment.status ===
                                        'rescheduled_pending' && (
                                        <button
                                            className="btn btn-sm btn-success"
                                            disabled={accepting.has(
                                                data.upcomingAppointment.id,
                                            )}
                                            onClick={() => {
                                                void acceptReschedule(
                                                    data.upcomingAppointment!
                                                        .id,
                                                );
                                            }}
                                        >
                                            Akceptuj nowy termin
                                        </button>
                                    )}
                                    {data.upcomingAppointment.status &&
                                        CANCELLABLE.has(
                                            data.upcomingAppointment.status,
                                        ) && (
                                            <button
                                                className="btn btn-sm btn-outline-danger"
                                                disabled={cancelling.has(
                                                    data.upcomingAppointment.id,
                                                )}
                                                onClick={() => {
                                                    void cancelAppointment(
                                                        data
                                                            .upcomingAppointment!
                                                            .id,
                                                    );
                                                }}
                                            >
                                                Anuluj
                                            </button>
                                        )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="salonbw-appointments-list">
                            <div className="salonbw-appointment-item salonbw-appointment-item--empty">
                                Brak zaplanowanych wizyt
                            </div>
                        </div>
                    )}
                    <Link
                        href="/booking"
                        className="salonbw-dashboard__section-footer"
                    >
                        zarezerwuj nową wizytę
                    </Link>
                </div>

                {/* Monthly summary */}
                <div className="salonbw-dashboard__section">
                    <div className="salonbw-dashboard__section-header">
                        <h2>Moje statystyki</h2>
                    </div>
                    <div className="salonbw-appointments-list">
                        <div className="salonbw-appointment-item">
                            <div className="salonbw-appointment-item__details">
                                <div className="salonbw-appointment-item__client">
                                    Zrealizowane wizyty
                                </div>
                            </div>
                            <div className="fw-bold">{data.completedCount}</div>
                        </div>
                        <div className="salonbw-appointment-item">
                            <div className="salonbw-appointment-item__details">
                                <div className="salonbw-appointment-item__client">
                                    Różne usługi
                                </div>
                            </div>
                            <div className="fw-bold">
                                {data.serviceHistory.length}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Favourite services */}
            {data.serviceHistory.length > 0 && (
                <div className="salonbw-dashboard__section mt-3">
                    <div className="salonbw-dashboard__section-header">
                        <h2>Ulubione usługi</h2>
                    </div>
                    <div className="salonbw-appointments-list">
                        {data.serviceHistory.slice(0, 5).map((service) => (
                            <div
                                key={service.id}
                                className="salonbw-appointment-item"
                            >
                                <div className="salonbw-appointment-item__details">
                                    <div className="salonbw-appointment-item__client">
                                        {service.name}
                                    </div>
                                </div>
                                <div className="text-muted small">
                                    {service.count}{' '}
                                    {service.count === 1
                                        ? 'wizyta'
                                        : service.count < 5
                                          ? 'wizyty'
                                          : 'wizyt'}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recent appointments */}
            <div className="salonbw-dashboard__section mt-3">
                <div className="salonbw-dashboard__section-header">
                    <h2>Ostatnie wizyty</h2>
                </div>
                {data.recentAppointments.length > 0 ? (
                    <div className="salonbw-appointments-list">
                        {data.recentAppointments.map((apt) => (
                            <div
                                key={apt.id}
                                className="salonbw-appointment-item"
                            >
                                <div className="salonbw-appointment-item__time">
                                    {new Date(apt.startTime).toLocaleDateString(
                                        'pl-PL',
                                        {
                                            day: 'numeric',
                                            month: 'short',
                                        },
                                    )}
                                </div>
                                <div className="salonbw-appointment-item__details">
                                    <div className="salonbw-appointment-item__client">
                                        {apt.serviceName}
                                    </div>
                                    {apt.employeeName && (
                                        <div className="salonbw-appointment-item__service text-muted small">
                                            {apt.employeeName}
                                        </div>
                                    )}
                                </div>
                                <div className="d-flex align-items-center gap-2 flex-wrap">
                                    <span className={statusClass(apt.status)}>
                                        {statusLabel(apt.status)}
                                    </span>
                                    {apt.status === 'rescheduled_pending' &&
                                        new Date(apt.startTime) >
                                            new Date() && (
                                            <button
                                                className="btn btn-sm btn-success"
                                                disabled={accepting.has(apt.id)}
                                                onClick={() => {
                                                    void acceptReschedule(
                                                        apt.id,
                                                    );
                                                }}
                                            >
                                                Akceptuj
                                            </button>
                                        )}
                                    {CANCELLABLE.has(apt.status) &&
                                        new Date(apt.startTime) >
                                            new Date() && (
                                            <button
                                                className="btn btn-sm btn-outline-danger"
                                                disabled={cancelling.has(
                                                    apt.id,
                                                )}
                                                onClick={() => {
                                                    void cancelAppointment(
                                                        apt.id,
                                                    );
                                                }}
                                            >
                                                Anuluj
                                            </button>
                                        )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="salonbw-appointments-list">
                        <div className="salonbw-appointment-item salonbw-appointment-item--empty">
                            Brak historii wizyt
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
