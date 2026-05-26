'use client';

import { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { pl } from 'date-fns/locale';
import type {
    Appointment,
    AppointmentStatus,
    ReceptionAlertSeverity,
    ReceptionAlertSeverityByCustomerId,
} from '@/types';
import { useAppointmentMutations } from '@/hooks/useAppointments';
import {
    getAppointmentPriority,
    hasCustomerAlert,
    isOverdueAppointmentAt,
} from './receptionUtils';
import { trackReceptionAction } from './receptionTelemetry';

interface ReceptionViewProps {
    appointments: Appointment[];
    loading?: boolean;
    readOnly?: boolean;
    emptyTitle?: string;
    emptyDescription?: string;
    onChanged?: () => void;
    onOpenFinalizeAppointment?: (appointmentId: number) => void;
    onOpenAppointment?: (appointmentId: number) => void;
    onActionTracked?: (params: {
        appointmentId: number;
        action:
            | 'open_appointment_drawer'
            | 'confirm_appointment'
            | 'start_appointment'
            | 'mark_no_show'
            | 'finalize_via_drawer';
        customerAlertSeverity?: ReceptionAlertSeverity;
    }) => void;
    customerAlertSeverityByCustomerId?: ReceptionAlertSeverityByCustomerId;
}

type StatusConfig = {
    label: string;
    className: string;
    actions: string[];
};

type ActionKey =
    | 'confirm'
    | 'start'
    | 'finalize'
    | 'cancel'
    | 'no_show'
    | 'reject';

const STATUS_CONFIG: Record<AppointmentStatus | string, StatusConfig> = {
    online_pending: {
        label: 'Oczekuje na potwierdzenie',
        className: 'salonbw-status--online-pending',
        actions: ['confirm', 'reject'],
    },
    rescheduled_pending: {
        label: 'Zmiana terminu — oczekuje',
        className: 'salonbw-status--rescheduled-pending',
        actions: ['confirm', 'reject'],
    },
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
    confirm: { label: 'Potwierdź', className: 'btn-success' },
    reject: { label: 'Odrzuć', className: 'btn-outline-danger' },
    start: { label: 'Rozpocznij', className: 'btn-primary' },
    finalize: { label: 'Finalizuj', className: 'btn-success' },
    cancel: { label: 'Anuluj', className: 'btn-danger' },
    no_show: { label: 'Nieobecny', className: 'btn-warning' },
};

export default function ReceptionView({
    appointments,
    loading,
    readOnly = false,
    emptyTitle = 'Brak wizyt na dziś',
    emptyDescription = 'Wybierz inną datę lub dodaj nową wizytę.',
    onChanged,
    onOpenFinalizeAppointment,
    onOpenAppointment,
    onActionTracked,
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
    const [nowTick, setNowTick] = useState(() => Date.now());
    const now = new Date(nowTick);

    useEffect(() => {
        const timerId = window.setInterval(() => {
            setNowTick(Date.now());
        }, 60_000);

        return () => {
            window.clearInterval(timerId);
        };
    }, []);

    // Sort appointments by operational priority, then by time.
    const sortedAppointments = [...appointments].sort((a, b) => {
        const priorityDiff =
            getAppointmentPriority(a, now, customerAlertSeverityByCustomerId) -
            getAppointmentPriority(b, now, customerAlertSeverityByCustomerId);
        if (priorityDiff !== 0) return priorityDiff;

        return (
            new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        );
    });

    const handleAction = async (
        appointment: Appointment,
        action: ActionKey,
    ) => {
        const customerAlertSeverity = appointment.client?.id
            ? customerAlertSeverityByCustomerId[appointment.client.id]
            : undefined;

        if (action === 'finalize') {
            trackReceptionAction({
                action: 'finalize_via_drawer',
                appointmentId: appointment.id,
                customerId: appointment.client?.id,
                customerAlertSeverity,
                source: 'reception_view',
            });
            onActionTracked?.({
                action: 'finalize_via_drawer',
                appointmentId: appointment.id,
                customerAlertSeverity,
            });
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
                    trackReceptionAction({
                        action: 'start_appointment',
                        appointmentId: appointment.id,
                        customerId: appointment.client?.id,
                        customerAlertSeverity,
                        source: 'reception_view',
                    });
                    onActionTracked?.({
                        action: 'start_appointment',
                        appointmentId: appointment.id,
                        customerAlertSeverity,
                    });
                    break;
                case 'confirm':
                    await updateAppointmentStatus.mutateAsync({
                        id: appointment.id,
                        status: 'confirmed',
                    });
                    trackReceptionAction({
                        action: 'confirm_appointment',
                        appointmentId: appointment.id,
                        customerId: appointment.client?.id,
                        customerAlertSeverity,
                        source: 'reception_view',
                    });
                    onActionTracked?.({
                        action: 'confirm_appointment',
                        appointmentId: appointment.id,
                        customerAlertSeverity,
                    });
                    break;
                case 'no_show':
                    await updateAppointmentStatus.mutateAsync({
                        id: appointment.id,
                        status: 'no_show',
                    });
                    trackReceptionAction({
                        action: 'mark_no_show',
                        appointmentId: appointment.id,
                        customerId: appointment.client?.id,
                        customerAlertSeverity,
                        source: 'reception_view',
                    });
                    onActionTracked?.({
                        action: 'mark_no_show',
                        appointmentId: appointment.id,
                        customerAlertSeverity,
                    });
                    break;
                case 'reject':
                    await cancelAppointment.mutateAsync(appointment.id);
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
                    <h3>{emptyTitle}</h3>
                    <p>{emptyDescription}</p>
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
    const pendingAppointments = sortedAppointments.filter(
        (a) =>
            a.status === 'online_pending' || a.status === 'rescheduled_pending',
    );
    const regularAppointments = sortedAppointments.filter(
        (a) =>
            a.status !== 'online_pending' && a.status !== 'rescheduled_pending',
    );
    const toFinalizeCount = appointments.filter(
        (appointment) => appointment.status === 'in_progress',
    ).length;
    const withAlertCount = appointments.filter((appointment) =>
        hasCustomerAlert(appointment, customerAlertSeverityByCustomerId),
    ).length;
    const overdueCount = appointments.filter((appointment) =>
        isOverdueAppointmentAt(appointment, now),
    ).length;

    const renderAppointmentRow = (appointment: Appointment) => {
        const status = appointment.status || 'scheduled';
        const config = STATUS_CONFIG[status] || STATUS_CONFIG.scheduled;
        const isRowPending = pendingAction?.appointmentId === appointment.id;
        const isOverdue = isOverdueAppointmentAt(appointment, now);
        const alertSeverity = hasCustomerAlert(
            appointment,
            customerAlertSeverityByCustomerId,
        )
            ? appointment.client?.id
                ? customerAlertSeverityByCustomerId[appointment.client.id]
                : undefined
            : undefined;
        const isInProgress = status === 'in_progress';

        return (
            <tr
                key={appointment.id}
                className={`${isOverdue ? 'salonbw-reception-row--overdue' : ''} ${isRowPending ? 'salonbw-reception-row--processing' : ''}`}
            >
                <td className="salonbw-reception-time">
                    <div className="d-flex flex-column gap-1">
                        <span>{formatTime(appointment.startTime)}</span>
                        {isInProgress ? (
                            <span className="badge text-bg-success">
                                Do finalizacji
                            </span>
                        ) : null}
                        {isOverdue ? (
                            <span className="badge text-bg-danger">
                                Opóźniona
                            </span>
                        ) : null}
                    </div>
                </td>
                <td>
                    <div className="salonbw-reception-client">
                        <strong>
                            {appointment.client?.name || 'Brak klienta'}
                        </strong>
                        {appointment.client?.phone && (
                            <div className="salonbw-reception-phone">
                                📞 {appointment.client.phone}
                            </div>
                        )}
                        {alertSeverity ? (
                            <span
                                className={`badge mt-1 ${
                                    alertSeverity === 'danger'
                                        ? 'text-bg-danger'
                                        : alertSeverity === 'warning'
                                          ? 'text-bg-warning'
                                          : 'text-bg-info'
                                }`}
                            >
                                Alert CRM
                            </span>
                        ) : null}
                    </div>
                </td>
                <td>{appointment.service?.name || '-'}</td>
                <td>{appointment.employee?.name || '-'}</td>
                <td>
                    {formatDuration(appointment.startTime, appointment.endTime)}
                </td>
                <td>{getStatusBadge(status)}</td>
                <td>
                    <div className="salonbw-reception-actions">
                        <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => {
                                const customerAlertSeverity = appointment.client
                                    ?.id
                                    ? customerAlertSeverityByCustomerId[
                                          appointment.client.id
                                      ]
                                    : undefined;
                                trackReceptionAction({
                                    action: 'open_appointment_drawer',
                                    appointmentId: appointment.id,
                                    customerId: appointment.client?.id,
                                    customerAlertSeverity,
                                    source: 'reception_view',
                                });
                                onActionTracked?.({
                                    action: 'open_appointment_drawer',
                                    appointmentId: appointment.id,
                                    customerAlertSeverity,
                                });
                                onOpenAppointment?.(appointment.id);
                            }}
                            disabled={isRowPending}
                        >
                            Otwórz
                        </button>
                        {readOnly
                            ? null
                            : config.actions.map((action) => {
                                  const actionConfig = ACTION_LABELS[action];
                                  const isActionPending =
                                      pendingAction?.appointmentId ===
                                          appointment.id &&
                                      pendingAction.action === action;
                                  return (
                                      <button
                                          key={action}
                                          type="button"
                                          className={`btn btn-sm ${actionConfig.className}`}
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
                        {(readOnly || config.actions.length === 0) && (
                            <span className="salonbw-reception-no-actions">
                                -
                            </span>
                        )}
                    </div>
                    {actionErrorByAppointmentId[appointment.id] ? (
                        <div className="small text-danger mt-1">
                            Wystąpił błąd podczas aktualizacji wizyty:{' '}
                            {actionErrorByAppointmentId[appointment.id]}
                        </div>
                    ) : null}
                </td>
            </tr>
        );
    };

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
                {pendingAppointments.length > 0 && (
                    <div className="salonbw-reception-summary__item salonbw-reception-summary__item--pending">
                        <span className="salonbw-reception-summary__value">
                            {pendingAppointments.length}
                        </span>
                        <span className="salonbw-reception-summary__label">
                            Do potwierdzenia
                        </span>
                    </div>
                )}
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

            {/* Pending confirmations section */}
            {pendingAppointments.length > 0 && (
                <div className="salonbw-reception-pending-section">
                    <div className="salonbw-reception-pending-section__header">
                        <span className="badge text-bg-warning me-2">
                            {pendingAppointments.length}
                        </span>
                        Wymagają potwierdzenia
                    </div>
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
                                {pendingAppointments.map((appointment) =>
                                    renderAppointmentRow(appointment),
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

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
                        {regularAppointments.map((appointment) =>
                            renderAppointmentRow(appointment),
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
