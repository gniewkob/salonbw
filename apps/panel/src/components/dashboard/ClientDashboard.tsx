import { useState } from 'react';
import Link from 'next/link';
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
import VisitNotes, {
    hasVisibleVisitNotes,
} from '@/components/client/VisitNotes';
import PanelButton from '@/components/ui/PanelButton';
import type { ClientDashboardResponse } from '@/types';

function visitDetailsHref(id: number) {
    return `/visits?visitId=${id}`;
}

type DashboardVisit = ClientDashboardResponse['recentAppointments'][number];

type DashboardAppointmentWithNotes =
    | DashboardVisit
    | NonNullable<ClientDashboardResponse['upcomingAppointment']>;

function hasVisitDetails(appointment: DashboardAppointmentWithNotes) {
    return hasVisibleVisitNotes({
        appointmentStatus: appointment.status,
        clientComment: appointment.clientComment,
        staffRecommendations: appointment.staffRecommendations,
        onlineAddonsSummary: appointment.onlineAddonsSummary,
        onlineTotalDurationMinutes: appointment.onlineTotalDurationMinutes,
        onlineDurationNeedsVerification:
            appointment.onlineDurationNeedsVerification,
    });
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
    const canAcceptPendingReschedule =
        pendingRescheduleAppointment?.status === 'rescheduled_pending' &&
        isFutureAppointment(pendingRescheduleAppointment.startTime);
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
    const upcomingRescheduleAlreadyHighlighted =
        data.upcomingAppointment?.id === pendingRescheduleAppointment?.id;

    return (
        <div className="salonbw-dashboard">
            <ClientPageHeader title="Mój panel" />

            {pendingActionsCount > 0 && (
                <div
                    className="client-action-panel client-action-panel--required"
                    role="alert"
                >
                    <div className="client-action-panel__marker">
                        {pendingActionsCount > 1 ? pendingActionsCount : '!'}
                    </div>
                    <div className="client-action-panel__content">
                        <div className="client-action-panel__eyebrow">
                            Akcja wymagana
                        </div>
                        <h2 className="client-action-panel__title">
                            {data.pendingRescheduleCount > 0
                                ? 'Potwierdź zmianę terminu wizyty'
                                : 'Odpowiedz na wiadomość z salonu'}
                        </h2>
                        {pendingRescheduleAppointment ? (
                            <div className="client-action-panel__appointment">
                                <strong>
                                    {pendingRescheduleAppointment.serviceName}
                                </strong>
                                <span>
                                    {formatDateTime(
                                        pendingRescheduleAppointment.startTime,
                                    )}
                                </span>
                            </div>
                        ) : null}
                        <div className="client-action-panel__details">
                            {data.pendingRescheduleCount > 0 ? (
                                <span>
                                    Salon zaproponował nowy termin. Możesz
                                    zaakceptować go od razu albo otworzyć
                                    szczegóły wizyty.
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
                    <div className="client-action-panel__actions">
                        {canAcceptPendingReschedule ? (
                            <PanelButton
                                type="button"
                                variant="primary"
                                className="client-action-panel__button"
                                disabled={accepting.has(
                                    pendingRescheduleAppointment.id,
                                )}
                                onClick={() => {
                                    void acceptReschedule(
                                        pendingRescheduleAppointment.id,
                                    );
                                }}
                            >
                                {accepting.has(pendingRescheduleAppointment.id)
                                    ? 'Akceptowanie…'
                                    : 'Akceptuj nowy termin'}
                            </PanelButton>
                        ) : null}
                        <PanelButton
                            href={primaryActionHref}
                            variant={
                                canAcceptPendingReschedule
                                    ? 'secondary'
                                    : 'primary'
                            }
                            className="client-action-panel__button"
                        >
                            {canAcceptPendingReschedule
                                ? 'Szczegóły'
                                : 'Załatw teraz'}
                        </PanelButton>
                    </div>
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
                                        <Link
                                            href={visitDetailsHref(
                                                data.upcomingAppointment.id,
                                            )}
                                            className="client-next-visit__service-link"
                                        >
                                            {
                                                data.upcomingAppointment
                                                    .serviceName
                                            }
                                        </Link>
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
                                        !upcomingRescheduleAlreadyHighlighted &&
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
                                    {hasVisitDetails(
                                        data.upcomingAppointment,
                                    ) ? (
                                        <VisitNotes
                                            compact
                                            appointmentStatus={
                                                data.upcomingAppointment.status
                                            }
                                            clientComment={
                                                data.upcomingAppointment
                                                    .clientComment
                                            }
                                            staffRecommendations={
                                                data.upcomingAppointment
                                                    .staffRecommendations
                                            }
                                            onlineAddonsSummary={
                                                data.upcomingAppointment
                                                    .onlineAddonsSummary
                                            }
                                            onlineTotalDurationMinutes={
                                                data.upcomingAppointment
                                                    .onlineTotalDurationMinutes
                                            }
                                            onlineDurationNeedsVerification={
                                                data.upcomingAppointment
                                                    .onlineDurationNeedsVerification
                                            }
                                        />
                                    ) : null}
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
                                        canAccept={
                                            data.upcomingAppointment.status ===
                                                'rescheduled_pending' &&
                                            !upcomingRescheduleAlreadyHighlighted &&
                                            isFutureAppointment(
                                                data.upcomingAppointment
                                                    .startTime,
                                            )
                                        }
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
                                        <Link
                                            href={visitDetailsHref(apt.id)}
                                            className="salonbw-appointment-item__title-link"
                                        >
                                            {apt.serviceName}
                                        </Link>
                                    </div>
                                    {apt.employeeName && (
                                        <div className="salonbw-appointment-item__service text-muted small">
                                            {apt.employeeName}
                                        </div>
                                    )}
                                    {hasVisitDetails(apt) ? (
                                        <VisitNotes
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
                                    ) : null}
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
