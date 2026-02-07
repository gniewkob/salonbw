'use client';

import { useState } from 'react';
import { format, parseISO, isPast, isToday } from 'date-fns';
import { pl } from 'date-fns/locale';
import type { Appointment, AppointmentStatus } from '@/types';
import { useAppointmentMutations } from '@/hooks/useAppointments';

interface ReceptionViewProps {
    appointments: Appointment[];
    loading?: boolean;
}

type StatusConfig = {
    label: string;
    className: string;
    actions: string[];
};

const STATUS_CONFIG: Record<AppointmentStatus | string, StatusConfig> = {
    scheduled: {
        label: 'Zaplanowana',
        className: 'versum-status--scheduled',
        actions: ['confirm', 'start', 'cancel', 'no_show'],
    },
    confirmed: {
        label: 'Potwierdzona',
        className: 'versum-status--confirmed',
        actions: ['start', 'cancel', 'no_show'],
    },
    in_progress: {
        label: 'W trakcie',
        className: 'versum-status--in-progress',
        actions: ['complete', 'cancel'],
    },
    completed: {
        label: 'Zakończona',
        className: 'versum-status--completed',
        actions: [],
    },
    cancelled: {
        label: 'Anulowana',
        className: 'versum-status--cancelled',
        actions: [],
    },
    no_show: {
        label: 'Nieobecność',
        className: 'versum-status--no-show',
        actions: [],
    },
};

const ACTION_LABELS: Record<string, { label: string; className: string }> = {
    confirm: { label: 'Potwierdź', className: 'versum-btn--success' },
    start: { label: 'Rozpocznij', className: 'versum-btn--primary' },
    complete: { label: 'Zakończ', className: 'versum-btn--success' },
    cancel: { label: 'Anuluj', className: 'versum-btn--danger' },
    no_show: { label: 'Nieobecny', className: 'versum-btn--warning' },
};

export default function ReceptionView({
    appointments,
    loading,
}: ReceptionViewProps) {
    const { cancelAppointment, completeAppointment, updateAppointmentStatus } =
        useAppointmentMutations();
    const [processingId, setProcessingId] = useState<number | null>(null);

    // Sort appointments by start time
    const sortedAppointments = [...appointments].sort((a, b) => {
        return (
            new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        );
    });

    const handleAction = async (appointment: Appointment, action: string) => {
        setProcessingId(appointment.id);
        try {
            switch (action) {
                case 'cancel':
                    await cancelAppointment.mutateAsync(appointment.id);
                    break;
                case 'complete':
                    await completeAppointment.mutateAsync(appointment.id);
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
        } catch (error) {
            console.error('Action failed:', error);
            alert('Wystąpił błąd podczas aktualizacji wizyty');
        }
        setProcessingId(null);
    };

    const getStatusBadge = (status: AppointmentStatus | string) => {
        const config = STATUS_CONFIG[status] || STATUS_CONFIG.scheduled;
        return (
            <span className={`versum-status-badge ${config.className}`}>
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
            <div className="versum-reception-view">
                <div className="versum-loading">Ładowanie wizyt...</div>
            </div>
        );
    }

    if (appointments.length === 0) {
        return (
            <div className="versum-reception-view">
                <div className="versum-reception-empty">
                    <div className="versum-reception-empty__icon">📅</div>
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

    return (
        <div className="versum-reception-view">
            {/* Summary */}
            <div className="versum-reception-summary">
                <div className="versum-reception-summary__item">
                    <span className="versum-reception-summary__value">
                        {appointments.length}
                    </span>
                    <span className="versum-reception-summary__label">
                        Wszystkich
                    </span>
                </div>
                <div className="versum-reception-summary__item versum-reception-summary__item--scheduled">
                    <span className="versum-reception-summary__value">
                        {byStatus.scheduled || 0}
                    </span>
                    <span className="versum-reception-summary__label">
                        Zaplanowanych
                    </span>
                </div>
                <div className="versum-reception-summary__item versum-reception-summary__item--confirmed">
                    <span className="versum-reception-summary__value">
                        {byStatus.confirmed || 0}
                    </span>
                    <span className="versum-reception-summary__label">
                        Potwierdzonych
                    </span>
                </div>
                <div className="versum-reception-summary__item versum-reception-summary__item--in-progress">
                    <span className="versum-reception-summary__value">
                        {byStatus.in_progress || 0}
                    </span>
                    <span className="versum-reception-summary__label">
                        W trakcie
                    </span>
                </div>
                <div className="versum-reception-summary__item versum-reception-summary__item--completed">
                    <span className="versum-reception-summary__value">
                        {byStatus.completed || 0}
                    </span>
                    <span className="versum-reception-summary__label">
                        Zakończonych
                    </span>
                </div>
            </div>

            {/* Appointments Table */}
            <div className="versum-reception-table-wrap">
                <table className="versum-reception-table">
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
                            const isProcessing =
                                processingId === appointment.id;
                            const startTime = parseISO(appointment.startTime);
                            const isOverdue =
                                isPast(startTime) &&
                                isToday(startTime) &&
                                status === 'scheduled';

                            return (
                                <tr
                                    key={appointment.id}
                                    className={`${isOverdue ? 'versum-reception-row--overdue' : ''} ${isProcessing ? 'versum-reception-row--processing' : ''}`}
                                >
                                    <td className="versum-reception-time">
                                        {formatTime(appointment.startTime)}
                                        {isOverdue && (
                                            <span className="versum-reception-overdue-badge">
                                                opóźnienie
                                            </span>
                                        )}
                                    </td>
                                    <td>
                                        <div className="versum-reception-client">
                                            <strong>
                                                {appointment.client?.name ||
                                                    'Brak klienta'}
                                            </strong>
                                            {appointment.client?.phone && (
                                                <div className="versum-reception-phone">
                                                    📞{' '}
                                                    {appointment.client.phone}
                                                </div>
                                            )}
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
                                        <div className="versum-reception-actions">
                                            {config.actions.map((action) => {
                                                const actionConfig =
                                                    ACTION_LABELS[action];
                                                return (
                                                    <button
                                                        key={action}
                                                        type="button"
                                                        className={`versum-btn versum-btn--sm ${actionConfig.className}`}
                                                        onClick={() =>
                                                            void handleAction(
                                                                appointment,
                                                                action,
                                                            )
                                                        }
                                                        disabled={isProcessing}
                                                    >
                                                        {actionConfig.label}
                                                    </button>
                                                );
                                            })}
                                            {config.actions.length === 0 && (
                                                <span className="versum-reception-no-actions">
                                                    -
                                                </span>
                                            )}
                                        </div>
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
