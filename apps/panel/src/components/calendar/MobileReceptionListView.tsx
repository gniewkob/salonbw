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

interface MobileReceptionListViewProps {
    appointments: Appointment[];
    loading?: boolean;
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

interface PrimaryAction {
    key: 'confirm' | 'start' | 'finalize';
    label: string;
}

const STATUS_LABELS: Record<AppointmentStatus | string, string> = {
    online_pending: 'Oczekuje',
    rescheduled_pending: 'Zmiana terminu',
    scheduled: 'Zaplanowana',
    confirmed: 'Potwierdzona',
    in_progress: 'W trakcie',
    completed: 'Zakończona',
    cancelled: 'Anulowana',
    no_show: 'Nieobecność',
};

function getPrimaryAction(
    status: AppointmentStatus | string,
): PrimaryAction | null {
    switch (status) {
        case 'online_pending':
        case 'rescheduled_pending':
        case 'scheduled':
            return { key: 'confirm', label: 'Potwierdź' };
        case 'confirmed':
            return { key: 'start', label: 'Rozpocznij' };
        case 'in_progress':
            return { key: 'finalize', label: 'Finalizuj' };
        default:
            return null;
    }
}

function statusColor(status: AppointmentStatus | string): {
    bg: string;
    fg: string;
} {
    switch (status) {
        case 'online_pending':
        case 'rescheduled_pending':
            return { bg: '#fff3cd', fg: '#664d03' };
        case 'confirmed':
            return { bg: '#d1e7dd', fg: '#0f5132' };
        case 'in_progress':
            return { bg: '#cfe2ff', fg: '#084298' };
        case 'completed':
            return { bg: '#e2e3e5', fg: '#41464b' };
        case 'cancelled':
        case 'no_show':
            return { bg: '#f8d7da', fg: '#842029' };
        case 'scheduled':
        default:
            return { bg: '#f5f5f5', fg: '#1a1a1a' };
    }
}

export default function MobileReceptionListView({
    appointments,
    loading,
    emptyTitle = 'Brak wizyt na dziś',
    emptyDescription = 'Wybierz inną datę lub dodaj nową wizytę.',
    onChanged,
    onOpenFinalizeAppointment,
    onOpenAppointment,
    onActionTracked,
    customerAlertSeverityByCustomerId = {},
}: MobileReceptionListViewProps) {
    const { cancelAppointment: _cancelMutation, updateAppointmentStatus } =
        useAppointmentMutations();
    const [pendingActionId, setPendingActionId] = useState<number | null>(null);
    const [errorById, setErrorById] = useState<Record<number, string>>({});
    const [nowTick, setNowTick] = useState(() => Date.now());
    const now = new Date(nowTick);
    void _cancelMutation;

    useEffect(() => {
        const id = window.setInterval(() => setNowTick(Date.now()), 60_000);
        return () => window.clearInterval(id);
    }, []);

    const sorted = [...appointments].sort((a, b) => {
        const priorityDiff =
            getAppointmentPriority(a, now, customerAlertSeverityByCustomerId) -
            getAppointmentPriority(b, now, customerAlertSeverityByCustomerId);
        if (priorityDiff !== 0) return priorityDiff;
        return (
            new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        );
    });

    const runPrimary = async (
        appointment: Appointment,
        action: PrimaryAction,
    ) => {
        const customerAlertSeverity = appointment.client?.id
            ? customerAlertSeverityByCustomerId[appointment.client.id]
            : undefined;

        if (action.key === 'finalize') {
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

        setPendingActionId(appointment.id);
        setErrorById((current) => {
            const next = { ...current };
            delete next[appointment.id];
            return next;
        });

        try {
            const nextStatus =
                action.key === 'confirm' ? 'confirmed' : 'in_progress';
            await updateAppointmentStatus.mutateAsync({
                id: appointment.id,
                status: nextStatus,
            });
            const telemetryAction =
                action.key === 'confirm'
                    ? 'confirm_appointment'
                    : 'start_appointment';
            trackReceptionAction({
                action: telemetryAction,
                appointmentId: appointment.id,
                customerId: appointment.client?.id,
                customerAlertSeverity,
                source: 'reception_view',
            });
            onActionTracked?.({
                action: telemetryAction,
                appointmentId: appointment.id,
                customerAlertSeverity,
            });
            onChanged?.();
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : 'Nie udało się zaktualizować wizyty.';
            setErrorById((current) => ({
                ...current,
                [appointment.id]: message,
            }));
        }
        setPendingActionId(null);
    };

    const openDetails = (appointment: Appointment) => {
        const customerAlertSeverity = appointment.client?.id
            ? customerAlertSeverityByCustomerId[appointment.client.id]
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
    };

    if (loading) {
        return (
            <div
                style={{
                    padding: '1.5rem',
                    textAlign: 'center',
                    color: '#6c757d',
                }}
            >
                Ładowanie wizyt...
            </div>
        );
    }

    if (appointments.length === 0) {
        return (
            <div style={{ padding: '2rem 1.25rem', textAlign: 'center' }}>
                <p
                    style={{
                        margin: 0,
                        fontSize: '1rem',
                        color: '#1a1a1a',
                        fontWeight: 600,
                    }}
                >
                    {emptyTitle}
                </p>
                <p
                    style={{
                        margin: '0.5rem 0 0',
                        fontSize: '0.875rem',
                        color: '#6c757d',
                    }}
                >
                    {emptyDescription}
                </p>
            </div>
        );
    }

    return (
        <ul
            style={{
                listStyle: 'none',
                margin: 0,
                padding: '0.75rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.625rem',
            }}
        >
            {sorted.map((appointment) => {
                const status = (appointment.status ?? 'scheduled') as
                    | AppointmentStatus
                    | string;
                const statusLabel = STATUS_LABELS[status] ?? status;
                const statusStyle = statusColor(status);
                const primary = getPrimaryAction(status);
                const alert = hasCustomerAlert(
                    appointment,
                    customerAlertSeverityByCustomerId,
                );
                const overdue = isOverdueAppointmentAt(appointment, now);
                const time = format(parseISO(appointment.startTime), 'HH:mm', {
                    locale: pl,
                });
                const error = errorById[appointment.id];
                const isPending = pendingActionId === appointment.id;

                return (
                    <li key={appointment.id}>
                        <article
                            style={{
                                background: '#ffffff',
                                border: '1px solid #e5e7eb',
                                borderRadius: 8,
                                padding: '0.75rem 0.875rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.5rem',
                                borderLeftWidth: 4,
                                borderLeftColor: overdue
                                    ? '#dc3545'
                                    : alert
                                      ? '#b4b8be'
                                      : '#e5e7eb',
                            }}
                        >
                            <button
                                type="button"
                                onClick={() => openDetails(appointment)}
                                style={{
                                    all: 'unset',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.375rem',
                                    minHeight: 44,
                                }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: '0.5rem',
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: '1.125rem',
                                            fontWeight: 700,
                                            color: '#0d0d0d',
                                            fontVariantNumeric: 'tabular-nums',
                                        }}
                                    >
                                        {time}
                                    </span>
                                    <span
                                        style={{
                                            fontSize: '0.75rem',
                                            fontWeight: 600,
                                            padding: '0.25rem 0.5rem',
                                            borderRadius: 4,
                                            background: statusStyle.bg,
                                            color: statusStyle.fg,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em',
                                        }}
                                    >
                                        {statusLabel}
                                    </span>
                                </div>
                                <div
                                    style={{
                                        fontSize: '0.95rem',
                                        color: '#1a1a1a',
                                        fontWeight: 600,
                                    }}
                                >
                                    {appointment.client?.name ?? 'Klient'}
                                    {alert ? (
                                        <span
                                            aria-label="Alert CRM"
                                            style={{
                                                marginLeft: '0.5rem',
                                                display: 'inline-block',
                                                width: 8,
                                                height: 8,
                                                borderRadius: '50%',
                                                background: '#dc3545',
                                                verticalAlign: 'middle',
                                            }}
                                        />
                                    ) : null}
                                </div>
                                <div
                                    style={{
                                        fontSize: '0.85rem',
                                        color: '#4a4a4a',
                                    }}
                                >
                                    {appointment.service?.name ?? '-'}
                                </div>
                            </button>
                            {error ? (
                                <div
                                    role="alert"
                                    style={{
                                        fontSize: '0.8rem',
                                        color: '#842029',
                                        background: '#f8d7da',
                                        padding: '0.5rem 0.625rem',
                                        borderRadius: 4,
                                    }}
                                >
                                    {error}
                                </div>
                            ) : null}
                            {primary ? (
                                <button
                                    type="button"
                                    disabled={isPending}
                                    onClick={() => {
                                        void runPrimary(appointment, primary);
                                    }}
                                    style={{
                                        minHeight: 44,
                                        padding: '0.625rem 1rem',
                                        background: isPending
                                            ? '#e5e7eb'
                                            : '#0d0d0d',
                                        color: isPending
                                            ? '#6c757d'
                                            : '#ffffff',
                                        border: 'none',
                                        borderRadius: 4,
                                        fontSize: '0.875rem',
                                        fontWeight: 600,
                                        letterSpacing: '0.04em',
                                        textTransform: 'uppercase',
                                        cursor: isPending
                                            ? 'not-allowed'
                                            : 'pointer',
                                    }}
                                >
                                    {isPending
                                        ? 'Zapisywanie...'
                                        : primary.label}
                                </button>
                            ) : null}
                        </article>
                    </li>
                );
            })}
        </ul>
    );
}
