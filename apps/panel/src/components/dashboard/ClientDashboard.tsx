import { useState } from 'react';
import { useClientDashboard } from '@/hooks/useDashboard';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import ConfirmModal from '@/components/ConfirmModal';
import ClientAppointmentActions, {
    CLIENT_ARCHIVE_STATUSES,
    CLIENT_CANCELLABLE_STATUSES,
} from '@/components/client/ClientAppointmentActions';
import ClientPageHeader from '@/components/client/ClientPageHeader';
import ClientPanelSection from '@/components/client/ClientPanelSection';
import PanelButton from '@/components/ui/PanelButton';

export default function ClientDashboard() {
    const { data, loading, error, refetch } = useClientDashboard();
    const { apiFetch } = useAuth();
    const toast = useToast();
    const [cancelling, setCancelling] = useState<Set<number>>(new Set());
    const [accepting, setAccepting] = useState<Set<number>>(new Set());
    const [confirmCancelId, setConfirmCancelId] = useState<number | null>(null);

    const cancelAppointment = async (id: number) => {
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
                <div className="alert alert-danger" role="alert">
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
            <ClientPageHeader title="Mój panel" />

            {/* Notification banner — pending reschedule or new messages */}
            {(data.pendingRescheduleCount > 0 ||
                data.newSalonMessageCount > 0) && (
                <div
                    className="client-dashboard-banner"
                    role="status"
                    aria-live="polite"
                >
                    <div className="client-dashboard-banner__messages">
                        {data.pendingRescheduleCount > 0 && (
                            <span className="client-dashboard-banner__msg">
                                Salon zaproponował nowy termin — zaakceptuj lub
                                odrzuć.
                            </span>
                        )}
                        {data.newSalonMessageCount > 0 && (
                            <span className="client-dashboard-banner__msg">
                                Masz nową wiadomość od salonu.
                            </span>
                        )}
                    </div>
                    <PanelButton
                        href="/visits"
                        size="sm"
                        variant="secondary"
                        className="flex-shrink-0"
                    >
                        Zobacz
                    </PanelButton>
                </div>
            )}

            {/* Nearest appointment */}
            <div className="salonbw-dashboard__grid">
                <ClientPanelSection
                    title="Nadchodząca wizyta"
                    footerHref="/booking"
                    footerLabel="zarezerwuj nową wizytę"
                >
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
                                <ClientAppointmentActions
                                    status={data.upcomingAppointment.status}
                                    accepting={accepting.has(
                                        data.upcomingAppointment.id,
                                    )}
                                    cancelling={cancelling.has(
                                        data.upcomingAppointment.id,
                                    )}
                                    onAccept={() => {
                                        void acceptReschedule(
                                            data.upcomingAppointment!.id,
                                        );
                                    }}
                                    onCancel={() =>
                                        setConfirmCancelId(
                                            data.upcomingAppointment!.id,
                                        )
                                    }
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="salonbw-appointments-list">
                            <div className="salonbw-appointment-item salonbw-appointment-item--empty">
                                Brak zaplanowanych wizyt
                            </div>
                        </div>
                    )}
                </ClientPanelSection>

                {/* Monthly summary */}
                <ClientPanelSection title="Moje statystyki">
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
                </ClientPanelSection>
            </div>

            {/* Favourite services */}
            {data.serviceHistory.length > 0 && (
                <ClientPanelSection title="Ulubione usługi" className="mt-3">
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
                </ClientPanelSection>
            )}

            {/* Recent appointments */}
            <ClientPanelSection
                title="Ostatnie wizyty"
                className="mt-3"
                footerHref="/visits"
                footerLabel="zobacz wszystkie wizyty i oceń odbyte"
            >
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
                                    {apt.notes && (
                                        <div className="salonbw-appointment-item__note small mt-1">
                                            <span className="fw-medium">
                                                Notatka:
                                            </span>{' '}
                                            {apt.notes}
                                        </div>
                                    )}
                                </div>
                                <ClientAppointmentActions
                                    status={apt.status}
                                    serviceId={apt.serviceId}
                                    acceptLabel="Akceptuj"
                                    accepting={accepting.has(apt.id)}
                                    cancelling={cancelling.has(apt.id)}
                                    canAccept={
                                        apt.status === 'rescheduled_pending' &&
                                        new Date(apt.startTime) > new Date()
                                    }
                                    canCancel={
                                        CLIENT_CANCELLABLE_STATUSES.has(
                                            apt.status,
                                        ) &&
                                        new Date(apt.startTime) > new Date()
                                    }
                                    showRebook={
                                        CLIENT_ARCHIVE_STATUSES.has(
                                            apt.status,
                                        ) && apt.serviceId > 0
                                    }
                                    onAccept={() => {
                                        void acceptReschedule(apt.id);
                                    }}
                                    onCancel={() => setConfirmCancelId(apt.id)}
                                />
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
            </ClientPanelSection>
            <div className="mt-3 d-flex flex-wrap align-items-center justify-content-between gap-2 p-3 border rounded bg-white">
                <div>
                    <div className="fw-semibold">Potrzebujesz pomocy?</div>
                    <div className="text-muted small">
                        Problem techniczny lub pytanie o konto — napisz do
                        administratora. Sprawy dotyczące samej wizyty omów z
                        fryzjerką w komentarzu przy wizycie.
                    </div>
                </div>
                <PanelButton
                    href="/helps/new"
                    size="sm"
                    variant="secondary"
                    className="flex-shrink-0"
                >
                    Kontakt z administratorem
                </PanelButton>
            </div>
            <ConfirmModal
                open={confirmCancelId !== null}
                title="Anuluj wizytę"
                message="Czy na pewno chcesz anulować tę wizytę?"
                confirmLabel="Anuluj wizytę"
                confirmVariant="danger"
                onConfirm={() => {
                    if (confirmCancelId === null) return;
                    const id = confirmCancelId;
                    setConfirmCancelId(null);
                    void cancelAppointment(id);
                }}
                onCancel={() => setConfirmCancelId(null)}
            />
        </div>
    );
}
