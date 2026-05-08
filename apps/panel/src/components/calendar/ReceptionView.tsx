'use client';

import { useState } from 'react';
import { format, parseISO, isPast, isToday } from 'date-fns';
import { pl } from 'date-fns/locale';
import type { Appointment, AppointmentStatus } from '@/types';
import { useAppointmentMutations } from '@/hooks/useAppointments';

interface ReceptionViewProps {
    appointments: Appointment[];
    loading?: boolean;
    onChanged?: () => void;
    onOpenFinalizeAppointment?: (appointmentId: number) => void;
    onOpenAppointment?: (appointmentId: number) => void;
    customerAlertSeverityByCustomerId?: Record<
        number,
        'info' | 'warning' | 'danger'
    >;
}

type StatusConfig = {
    label: string;
    className: string;
    actions: string[];
};

type ActionKey = 'confirm' | 'start' | 'finalize' | 'cancel' | 'no_show';

const STATUS_CONFIG: Record<AppointmentStatus | string, StatusConfig> = {
    scheduled: {
        label: 'Zaplanowana',
        className: 'salonbw-status--scheduled',
        actions: ['confirm', 'start', 'cancel', 'no_show'],
    },
    confirmed: {
        label: 'Potwierdzona',
        className: 'salonbw-status--confirmed',
        actions: ['start', 'cancel', 'no_show'],
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

const ACTION_LABELS: Record<string, { label: string; className: string }> = {
    confirm: { label: 'Potwierdź', className: 'salonbw-btn--success' },
    start: { label: 'Rozpocznij', className: 'salonbw-btn--primary' },
    finalize: { label: 'Finalizuj', className: 'salonbw-btn--success' },
    cancel: { label: 'Anuluj', className: 'salonbw-btn--danger' },
    no_show: { label: 'Nieobecny', className: 'salonbw-btn--warning' },
};

export default function ReceptionView({
    appointments,
    loading,
    onChanged,
    onOpenFinalizeAppointment,
    onOpenAppointment,
    customerAlertSeverityByCustomerId = {},
}: ReceptionViewProps) {
    const { cancelAppointment, updateAppointmentStatus } =
        useAppointmentMutations();
    const [pendingAction, setPendingAction] = useState<{
        appointmentId: number;
        action: ActionKey;
    } | null>(null);
    const [actionErrorByAppointmentId, setActionErrorByAppointmentId] =
        useState<Record<number, string>>({});
    const now = new Date();

    const isOverdueAppointment = (appointment: Appointment) => {
        if ((appointment.status ?? 'scheduled') !== 'scheduled') return false;
        const startTime = parseISO(appointment.startTime);
        return isToday(startTime) && isPast(startTime) && startTime < now;
    };

    const hasCustomerAlert = (appointment: Appointment) => {
        const customerId = appointment.client?.id;
        return customerId
            ? Boolean(customerAlertSeverityByCustomerId[customerId])
            : false;
    };

    const getAppointmentPriority = (appointment: Appointment) => {
        if (isOverdueAppointment(appointment)) return 0;
        if ((appointment.status ?? 'scheduled') === 'in_progress') return 1;
        if (hasCustomerAlert(appointment)) return 2;
        return 3;
    };

    // Sort appointments by operational priority, then by time.
    const sortedAppointments = [...appointments].sort((a, b) => {
        const priorityDiff =
            getAppointmentPriority(a) - getAppointmentPriority(b);
        if (priorityDiff !== 0) return priorityDiff;

        return (
            new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        );
    });

    const handleAction = async (
        appointment: Appointment,
        action: ActionKey,
    ) => {
        if (action === 'finalize') {
            onOpenFinalizeAppointment?.(appointment.id);
            return;
        }

        setPendingAction({ appointmentId: appointment.id, action });
        setActionErrorByAppointmentId((current) => {
            const next = { ...current };
            delete next[appointment.id];
            return next;
        });
        try {
            switch (action) {
                case 'cancel':
                    await cancelAppointment.mutateAsync(appointment.id);
                    break;
                case 'start':
                    // Start = change status to in_progress
                    await updateAppointmentStatus.mutateAsync({
                        id: appointment.id,
                        status: 'in_progress',
                    });
                    break;
                case 'confirm':
                    await updateAppointmentStatus.mutateAsync({
                        id: appointment.id,
                        status: 'confirmed',
                    });
                    break;
                case 'no_show':
                    await updateAppointmentStatus.mutateAsync({
                        id: appointment.id,
                        status: 'no_show',
                    });
                    break;
                default:
                    console.warn('Unknown action:', action);
            }
            onChanged?.();
        } catch (error) {
            console.error('Action failed:', error);
            const message =
                error instanceof Error
                    ? error.message
                    : 'Wystąpił błąd podczas aktualizacji wizyty';
            setActionErrorByAppointmentId((current) => ({
                ...current,
                [appointment.id]: message,
            }));
        }
        setPendingAction(null);
    };

    const getStatusBadge = (status: AppointmentStatus | string) => {
        const config = STATUS_CONFIG[status] || STATUS_CONFIG.scheduled;
        return (
            <span className={`salonbw-status-badge ${config.className}`}>
                {config.label}
            </span>
        );
    };

    const formatTime = (dateString: string) => {
        return format(parseISO(dateString), 'HH:mm', { locale: pl });
    };

    const formatDuration = (start: string, end?: string) => {
        if (!end) return '-';
        const startDate = parseISO(start);
        const endDate = parseISO(end);
        const minutes = Math.round(
            (endDate.getTime() - startDate.getTime()) / 60000,
        );
        return `${minutes} min`;
    };

    if (loading) {
        return (
            <div className="salonbw-reception-view">
                <div className="salonbw-loading">Ładowanie wizyt...</div>
            </div>
        );
    }

    if (appointments.length === 0) {
        return (
            <div className="salonbw-reception-view">
                <div className="salonbw-reception-empty">
                    <div className="salonbw-reception-empty__icon">📅</div>
                    <h3>Brak wizyt na dziś</h3>
                    <p>Wybierz inną datę lub dodaj nową wizytę.</p>
                </div>
            </div>
        );
    }

    // Group by status for summary
    const byStatus = appointments.reduce(
        (acc, app) => {
            const status = app.status || 'scheduled';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        },
        {} as Record<string, number>,
    );
    const toFinalizeCount = appointments.filter(
        (appointment) => appointment.status === 'in_progress',
    ).length;
    const withAlertCount = appointments.filter(hasCustomerAlert).length;
    const overdueCount = appointments.filter(isOverdueAppointment).length;

    return (
        <div className="salonbw-reception-view">
            {/* Summary */}
            <div className="salonbw-reception-summary">
                <div className="salonbw-reception-summary__item">
                    <span className="salonbw-reception-summary__value">
                        {appointments.length}
                    </span>
                    <span className="salonbw-reception-summary__label">
                        Wszystkich
                    </span>
                </div>
                <div className="salonbw-reception-summary__item salonbw-reception-summary__item--scheduled">
                    <span className="salonbw-reception-summary__value">
                        {byStatus.scheduled || 0}
                    </span>
                    <span className="salonbw-reception-summary__label">
                        Zaplanowanych
                    </span>
                </div>
                <div className="salonbw-reception-summary__item salonbw-reception-summary__item--confirmed">
                    <span className="salonbw-reception-summary__value">
                        {byStatus.confirmed || 0}
                    </span>
                    <span className="salonbw-reception-summary__label">
                        Potwierdzonych
                    </span>
                </div>
                <div className="salonbw-reception-summary__item salonbw-reception-summary__item--in-progress">
                    <span className="salonbw-reception-summary__value">
                        {byStatus.in_progress || 0}
                    </span>
                    <span className="salonbw-reception-summary__label">
                        W trakcie
                    </span>
                </div>
                <div className="salonbw-reception-summary__item salonbw-reception-summary__item--completed">
                    <span className="salonbw-reception-summary__value">
                        {byStatus.completed || 0}
                    </span>
                    <span className="salonbw-reception-summary__label">
                        Zakończonych
                    </span>
                </div>
                <div className="salonbw-reception-summary__item salonbw-reception-summary__item--in-progress">
                    <span className="salonbw-reception-summary__value">
                        {toFinalizeCount}
                    </span>
                    <span className="salonbw-reception-summary__label">
                        Do finalizacji
                    </span>
                </div>
                <div className="salonbw-reception-summary__item salonbw-reception-summary__item--confirmed">
                    <span className="salonbw-reception-summary__value">
                        {withAlertCount}
                    </span>
                    <span className="salonbw-reception-summary__label">
                        Z alertem CRM
                    </span>
                </div>
                <div className="salonbw-reception-summary__item salonbw-reception-summary__item--scheduled">
                    <span className="salonbw-reception-summary__value">
                        {overdueCount}
                    </span>
                    <span className="salonbw-reception-summary__label">
                        Opóźnione
                    </span>
                </div>
            </div>

            {/* Appointments Table */}
            <div className="salonbw-reception-table-wrap">
                <table className="salonbw-reception-table">
                    <thead>
                        <tr>
                            <th>Godzina</th>
                            <th>Klient</th>
                            <th>Usługa</th>
                            <th>Pracownik</th>
                            <th>Czas</th>
                            <th>Status</th>
                            <th>Akcje</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedAppointments.map((appointment) => {
                            const status = appointment.status || 'scheduled';
                            const config =
                                STATUS_CONFIG[status] ||
                                STATUS_CONFIG.scheduled;
                            const isRowPending =
                                pendingAction?.appointmentId === appointment.id;
                            const isOverdue = isOverdueAppointment(appointment);
                            const alertSeverity = hasCustomerAlert(appointment)
                                ? appointment.client?.id
                                    ? customerAlertSeverityByCustomerId[
                                          appointment.client.id
                                      ]
                                    : undefined
                                : undefined;

                            return (
                                <tr
                                    key={appointment.id}
                                    className={`${isOverdue ? 'salonbw-reception-row--overdue' : ''} ${isRowPending ? 'salonbw-reception-row--processing' : ''}`}
                                >
                                    <td className="salonbw-reception-time">
                                        {formatTime(appointment.startTime)}
                                        {isOverdue && (
                                            <span className="salonbw-reception-overdue-badge">
                                                opóźnienie
                                            </span>
                                        )}
                                    </td>
                                    <td>
                                        <div className="salonbw-reception-client">
                                            <strong>
                                                {appointment.client?.name ||
                                                    'Brak klienta'}
                                            </strong>
                                            {appointment.client?.phone && (
                                                <div className="salonbw-reception-phone">
                                                    📞{' '}
                                                    {appointment.client.phone}
                                                </div>
                                            )}
                                            {alertSeverity ? (
                                                <div
                                                    className={`small mt-1 ${
                                                        alertSeverity ===
                                                        'danger'
                                                            ? 'text-danger'
                                                            : alertSeverity ===
                                                                'warning'
                                                              ? 'text-warning-emphasis'
                                                              : 'text-info-emphasis'
                                                    }`}
                                                >
                                                    Alert CRM
                                                </div>
                                            ) : null}
                                        </div>
                                    </td>
                                    <td>{appointment.service?.name || '-'}</td>
                                    <td>{appointment.employee?.name || '-'}</td>
                                    <td>
                                        {formatDuration(
                                            appointment.startTime,
                                            appointment.endTime,
                                        )}
                                    </td>
                                    <td>{getStatusBadge(status)}</td>
                                    <td>
                                        <div className="salonbw-reception-actions">
                                            <button
                                                type="button"
                                                className="salonbw-btn salonbw-btn--sm salonbw-btn--secondary"
                                                onClick={() =>
                                                    onOpenAppointment?.(
                                                        appointment.id,
                                                    )
                                                }
                                                disabled={isRowPending}
                                            >
                                                Otwórz
                                            </button>
                                            {config.actions.map((action) => {
                                                const actionConfig =
                                                    ACTION_LABELS[action];
                                                const isActionPending =
                                                    pendingAction?.appointmentId ===
                                                        appointment.id &&
                                                    pendingAction.action ===
                                                        action;
                                                return (
                                                    <button
                                                        key={action}
                                                        type="button"
                                                        className={`salonbw-btn salonbw-btn--sm ${actionConfig.className}`}
                                                        onClick={() =>
                                                            void handleAction(
                                                                appointment,
                                                                action as ActionKey,
                                                            )
                                                        }
                                                        disabled={isRowPending}
                                                    >
                                                        {isActionPending
                                                            ? 'Trwa...'
                                                            : actionConfig.label}
                                                    </button>
                                                );
                                            })}
                                            {config.actions.length === 0 && (
                                                <span className="salonbw-reception-no-actions">
                                                    -
                                                </span>
                                            )}
                                        </div>
                                        {actionErrorByAppointmentId[
                                            appointment.id
                                        ] ? (
                                            <div className="small text-danger mt-1">
                                                Wystąpił błąd podczas
                                                aktualizacji wizyty:{' '}
                                                {
                                                    actionErrorByAppointmentId[
                                                        appointment.id
                                                    ]
                                                }
                                            </div>
                                        ) : null}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
