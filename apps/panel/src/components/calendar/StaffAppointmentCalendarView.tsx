import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { pl } from 'date-fns/locale';
import type { Appointment, AppointmentStatus } from '@/types';
import { useAppointmentMutations } from '@/hooks/useAppointments';
import FinalizationModal from './FinalizationModal';

interface StaffAppointmentCalendarViewProps {
    appointments: Appointment[];
    loading?: boolean;
    readOnly?: boolean;
    emptyTitle?: string;
    emptyDescription?: string;
    onChanged?: () => void;
    onOpenAppointment?: (appointmentId: number) => void;
}

type ActionKey = 'start' | 'finalize' | 'no_show' | 'cancel';

type StatusConfig = {
    label: string;
    className: string;
    actions: ActionKey[];
};

const STATUS_CONFIG: Record<AppointmentStatus | string, StatusConfig> = {
    scheduled: {
        label: 'Zaplanowana',
        className: 'salonbw-status--scheduled',
        actions: ['start', 'no_show', 'cancel'],
    },
    confirmed: {
        label: 'Potwierdzona',
        className: 'salonbw-status--confirmed',
        actions: ['start', 'no_show', 'cancel'],
    },
    in_progress: {
        label: 'W trakcie',
        className: 'salonbw-status--in-progress',
        actions: ['finalize', 'cancel'],
    },
    completed: {
        label: 'Zakończona',
        className: 'salonbw-status--completed',
        actions: [],
    },
    cancelled: {
        label: 'Anulowana',
        className: 'salonbw-status--cancelled',
        actions: [],
    },
    no_show: {
        label: 'Nieobecność',
        className: 'salonbw-status--no-show',
        actions: [],
    },
};

const ACTION_CONFIG: Record<
    ActionKey,
    { label: string; className: string; nextStatus?: AppointmentStatus }
> = {
    start: {
        label: 'Rozpocznij',
        className: 'salonbw-btn--primary',
        nextStatus: 'in_progress',
    },
    finalize: {
        label: 'Finalizuj',
        className: 'salonbw-btn--success',
    },
    no_show: {
        label: 'No-show',
        className: 'salonbw-btn--warning',
        nextStatus: 'no_show',
    },
    cancel: {
        label: 'Anuluj',
        className: 'salonbw-btn--danger',
    },
};

export default function StaffAppointmentCalendarView({
    appointments,
    loading = false,
    readOnly = false,
    emptyTitle = 'Brak wizyt na wybrany dzień',
    emptyDescription = 'Wybierz inną datę lub dodaj nową wizytę.',
    onChanged,
    onOpenAppointment,
}: StaffAppointmentCalendarViewProps) {
    const { cancelAppointment, updateAppointmentStatus } =
        useAppointmentMutations();
    const [pendingAction, setPendingAction] = useState<{
        appointmentId: number;
        action: ActionKey;
    } | null>(null);
    const [actionErrorByAppointmentId, setActionErrorByAppointmentId] =
        useState<Record<number, string>>({});
    const [finalizingAppointment, setFinalizingAppointment] =
        useState<Appointment | null>(null);

    const sortedAppointments = [...appointments].sort(
        (a, b) =>
            new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );

    const formatTime = (dateString: string) =>
        format(parseISO(dateString), 'HH:mm', { locale: pl });

    const formatDuration = (start: string, end?: string) => {
        if (!end) return '-';
        const startDate = parseISO(start);
        const endDate = parseISO(end);
        const minutes = Math.round(
            (endDate.getTime() - startDate.getTime()) / 60_000,
        );
        return `${minutes} min`;
    };

    const handleAction = async (
        appointment: Appointment,
        action: ActionKey,
    ) => {
        if (action === 'finalize') {
            setFinalizingAppointment(appointment);
            return;
        }

        setPendingAction({ appointmentId: appointment.id, action });
        setActionErrorByAppointmentId((current) => {
            const next = { ...current };
            delete next[appointment.id];
            return next;
        });

        try {
            if (action === 'cancel') {
                await cancelAppointment.mutateAsync(appointment.id);
            } else {
                await updateAppointmentStatus.mutateAsync({
                    id: appointment.id,
                    status: ACTION_CONFIG[action].nextStatus ?? 'scheduled',
                });
            }
            onChanged?.();
        } catch {
            const message = 'Wystąpił błąd podczas aktualizacji wizyty';
            setActionErrorByAppointmentId((current) => ({
                ...current,
                [appointment.id]: message,
            }));
        } finally {
            setPendingAction(null);
        }
    };

    if (loading) {
        return <div className="salonbw-loading">Ładowanie wizyt...</div>;
    }

    if (appointments.length === 0) {
        return (
            <div className="salonbw-reception-empty">
                <div className="salonbw-reception-empty__icon">📅</div>
                <h3>{emptyTitle}</h3>
                <p>{emptyDescription}</p>
            </div>
        );
    }

    return (
        <>
        <FinalizationModal
            open={finalizingAppointment !== null}
            appointment={finalizingAppointment}
            onClose={() => setFinalizingAppointment(null)}
            onSuccess={() => {
                setFinalizingAppointment(null);
                onChanged?.();
            }}
        />
        <div className="salonbw-reception-list">
            {sortedAppointments.map((appointment) => {
                const status = appointment.status || 'scheduled';
                const statusConfig =
                    STATUS_CONFIG[status] || STATUS_CONFIG.scheduled;
                const actions = readOnly ? [] : statusConfig.actions;
                return (
                    <article
                        key={appointment.id}
                        className="salonbw-reception-item"
                    >
                        <div className="salonbw-reception-item__header">
                            <div>
                                <h4 className="salonbw-reception-item__title">
                                    {appointment.service?.name || 'Wizyta'}
                                </h4>
                                <div className="salonbw-reception-item__meta">
                                    <span>
                                        {formatTime(appointment.startTime)} -{' '}
                                        {formatTime(
                                            appointment.endTime ??
                                                appointment.startTime,
                                        )}
                                    </span>
                                    <span>·</span>
                                    <span>
                                        {formatDuration(
                                            appointment.startTime,
                                            appointment.endTime,
                                        )}
                                    </span>
                                </div>
                            </div>
                            <span
                                className={`salonbw-status-badge ${statusConfig.className}`}
                            >
                                {statusConfig.label}
                            </span>
                        </div>
                        <div className="salonbw-reception-item__details">
                            <span>
                                {appointment.client?.name || 'Brak klienta'}
                            </span>
                        </div>
                        <div className="salonbw-reception-item__actions">
                            {actions.map((action) => {
                                const config = ACTION_CONFIG[action];
                                const isPending =
                                    pendingAction?.appointmentId ===
                                        appointment.id &&
                                    pendingAction.action === action;
                                return (
                                    <button
                                        key={action}
                                        type="button"
                                        className={`salonbw-btn salonbw-btn--sm ${config.className}`}
                                        onClick={() =>
                                            void handleAction(
                                                appointment,
                                                action,
                                            )
                                        }
                                        disabled={Boolean(pendingAction)}
                                    >
                                        {isPending
                                            ? 'Zapisywanie...'
                                            : config.label}
                                    </button>
                                );
                            })}
                            <button
                                type="button"
                                className="salonbw-btn salonbw-btn--sm salonbw-btn--secondary"
                                onClick={() =>
                                    onOpenAppointment?.(appointment.id)
                                }
                            >
                                Otwórz
                            </button>
                        </div>
                        {actionErrorByAppointmentId[appointment.id] ? (
                            <p className="text-danger small mb-0 mt-2">
                                {actionErrorByAppointmentId[appointment.id]}
                            </p>
                        ) : null}
                    </article>
                );
            })}
        </div>
        </>
    );
}
