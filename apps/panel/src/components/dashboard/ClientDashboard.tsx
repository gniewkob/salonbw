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
import RescheduleChangeNotice from '@/components/client/RescheduleChangeNotice';
import VisitNotes from '@/components/client/VisitNotes';
import PanelButton from '@/components/ui/PanelButton';

function visitDetailsHref(id: number) {
    return `/visits?visitId=${id}`;
}

const ACTIVE_APPOINTMENT_STATUSES = new Set([
    'scheduled',
    'confirmed',
    'in_progress',
    'online_pending',
    'rescheduled_pending',
]);

function isFutureAppointment(startTime: string) {
    return new Date(startTime).getTime() > Date.now();
}

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

    const formatDateTime = (dateStr: string) =>
        new Date(dateStr).toLocaleString('pl-PL', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    const formatDay = (dateStr: string) =>
        new Date(dateStr).toLocaleDateString('pl-PL', {
            day: 'numeric',
            month: 'short',
        });
    const formatHour = (dateStr: string) =>
        new Date(dateStr).toLocaleTimeString('pl-PL', {
            hour: '2-digit',
            minute: '2-digit',
        });
    const pendingActionsCount =
        data.pendingRescheduleCount + data.newSalonMessageCount;
    const pendingRescheduleAppointment =
        data.pendingRescheduleAppointment ??
        (data.upcomingAppointment?.status === 'rescheduled_pending'
            ? data.upcomingAppointment
            : data.recentAppointments.find(
                  (apt) => apt.status === 'rescheduled_pending',
              ));
    const primaryActionHref = pendingRescheduleAppointment
        ? visitDetailsHref(pendingRescheduleAppointment.id)
        : data.upcomingAppointment
          ? visitDetailsHref(data.upcomingAppointment.id)
          : '/visits';
    const highlightedAppointmentIds = new Set(
        [data.upcomingAppointment?.id, pendingRescheduleAppointment?.id].filter(
            (id): id is number => typeof id === 'number',
        ),
    );
    const dashboardRecentAppointments = data.recentAppointments.filter(
        (apt) =>
            !highlightedAppointmentIds.has(apt.id) &&
            !(
                ACTIVE_APPOINTMENT_STATUSES.has(apt.status) &&
                isFutureAppointment(apt.startTime)
            ),
    );

    return (
        <div className="salonbw-dashboard">
            <ClientPageHeader title="Mój panel" />

            {pendingActionsCount > 0 && (
                <div
                    className="client-action-panel"
                    role="status"
                    aria-live="polite"
                >
                    <div className="client-action-panel__marker">
                        {pendingActionsCount}
                    </div>
                    <div className="client-action-panel__content">
                        <div className="client-action-panel__eyebrow">
                            Do zrobienia
                        </div>
                        <h2 className="client-action-panel__title">
                            {data.pendingRescheduleCount > 0
                                ? 'Potwierdź zmianę terminu wizyty'
                                : 'Odpowiedz na wiadomość z salonu'}
                        </h2>
                        <div className="client-action-panel__details">
                            {data.pendingRescheduleCount > 0 ? (
                                <span>
                                    Salon zaproponował nowy termin. Wejdź w
                                    wizytę i zaakceptuj albo anuluj zmianę.
                                </span>
                            ) : null}
                            {data.newSalonMessageCount > 0 ? (
                                <span>
                                    Masz wiadomość przy wizycie. Otwórz
                                    szczegóły i odpisz w wątku.
                                </span>
                            ) : null}
                            {pendingRescheduleAppointment?.reschedulePreviousStartTime ? (
                                <RescheduleChangeNotice
                                    previousStartTime={
                                        pendingRescheduleAppointment.reschedulePreviousStartTime
                                    }
                                    newStartTime={
                                        pendingRescheduleAppointment.startTime
                                    }
                                />
                            ) : null}
                        </div>
                    </div>
                    <PanelButton
                        href={primaryActionHref}
                        variant="primary"
                        className="client-action-panel__button"
                    >
                        Przejdź do akcji
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
                            <div className="client-next-visit">
                                <div className="client-next-visit__date">
                                    <span>
                                        {formatDay(
                                            data.upcomingAppointment.startTime,
                                        )}
                                    </span>
                                    <strong>
                                        {formatHour(
                                            data.upcomingAppointment.startTime,
                                        )}
                                    </strong>
                                </div>
                                <div className="client-next-visit__main">
                                    <div className="client-next-visit__service">
                                        {data.upcomingAppointment.serviceName}
                                    </div>
                                    <div className="client-next-visit__meta">
                                        {formatDateTime(
                                            data.upcomingAppointment.startTime,
                                        )}
                                    </div>
                                    {data.upcomingAppointment.employeeName && (
                                        <div className="client-next-visit__meta">
                                            specjalista:{' '}
                                            {
                                                data.upcomingAppointment
                                                    .employeeName
                                            }
                                        </div>
                                    )}
                                    {data.upcomingAppointment.status ===
                                        'rescheduled_pending' &&
                                        data.upcomingAppointment
                                            .reschedulePreviousStartTime && (
                                            <RescheduleChangeNotice
                                                previousStartTime={
                                                    data.upcomingAppointment
                                                        .reschedulePreviousStartTime
                                                }
                                                newStartTime={
                                                    data.upcomingAppointment
                                                        .startTime
                                                }
                                            />
                                        )}
                                </div>
                                <div className="client-next-visit__actions">
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
                                    <PanelButton
                                        href={visitDetailsHref(
                                            data.upcomingAppointment.id,
                                        )}
                                        size="sm"
                                        variant="secondary"
                                    >
                                        Szczegóły
                                    </PanelButton>
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
                {dashboardRecentAppointments.length > 0 ? (
                    <div className="salonbw-appointments-list">
                        {dashboardRecentAppointments.map((apt) => (
                            <div
                                key={apt.id}
                                className="salonbw-appointment-item"
                            >
                                <div className="salonbw-appointment-item__time">
                                    {formatDay(apt.startTime)}
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
                                    {(apt.notes ||
                                        apt.clientComment ||
                                        apt.staffRecommendations ||
                                        apt.onlineAddonsSummary ||
                                        apt.onlineTotalDurationMinutes ||
                                        apt.onlineDurationNeedsVerification) && (
                                        <VisitNotes
                                            notes={apt.notes}
                                            compact
                                            appointmentStatus={apt.status}
                                            clientComment={apt.clientComment}
                                            staffRecommendations={
                                                apt.staffRecommendations
                                            }
                                            onlineAddonsSummary={
                                                apt.onlineAddonsSummary
                                            }
                                            onlineTotalDurationMinutes={
                                                apt.onlineTotalDurationMinutes
                                            }
                                            onlineDurationNeedsVerification={
                                                apt.onlineDurationNeedsVerification
                                            }
                                        />
                                    )}
                                    {apt.status === 'rescheduled_pending' &&
                                        apt.reschedulePreviousStartTime && (
                                            <RescheduleChangeNotice
                                                previousStartTime={
                                                    apt.reschedulePreviousStartTime
                                                }
                                                newStartTime={apt.startTime}
                                            />
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
                                <PanelButton
                                    href={visitDetailsHref(apt.id)}
                                    size="sm"
                                    variant="ghost"
                                >
                                    Szczegóły
                                </PanelButton>
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
