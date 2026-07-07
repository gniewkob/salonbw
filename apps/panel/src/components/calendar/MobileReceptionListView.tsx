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
import MobileBottomSheet from '@/components/salon/MobileBottomSheet';
import Skeleton from '@/components/ui/Skeleton';
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

type ActionKey =
    | 'confirm'
    | 'start'
    | 'finalize'
    | 'cancel'
    | 'no_show'
    | 'reject';

type ActionTone = 'primary' | 'default' | 'danger' | 'warning';

interface ActionConfig {
    label: string;
    tone: ActionTone;
}

const ACTION_CONFIG: Record<ActionKey, ActionConfig> = {
    confirm: { label: 'Potwierdź', tone: 'primary' },
    start: { label: 'Rozpocznij', tone: 'primary' },
    finalize: { label: 'Finalizuj', tone: 'primary' },
    cancel: { label: 'Anuluj wizytę', tone: 'danger' },
    no_show: { label: 'Oznacz nieobecność', tone: 'warning' },
    reject: { label: 'Odrzuć', tone: 'danger' },
};

const STATUS_ACTIONS: Record<AppointmentStatus | string, ActionKey[]> = {
    online_pending: ['confirm', 'reject'],
    rescheduled_pending: ['reject'],
    scheduled: ['confirm', 'cancel', 'no_show'],
    confirmed: ['start', 'cancel', 'no_show'],
    in_progress: ['finalize', 'cancel'],
    completed: [],
    cancelled: [],
    no_show: [],
};

const STATUS_LABELS: Record<AppointmentStatus | string, string> = {
    online_pending: 'Oczekuje',
    rescheduled_pending: 'Czeka na akceptację klienta',
    scheduled: 'Zaplanowana',
    confirmed: 'Potwierdzona',
    in_progress: 'W trakcie',
    completed: 'Zakończona',
    cancelled: 'Anulowana',
    no_show: 'Nieobecność',
};

function getActionsForStatus(status: AppointmentStatus | string): ActionKey[] {
    return STATUS_ACTIONS[status] ?? [];
}

function getPrimaryActionKey(
    status: AppointmentStatus | string,
): ActionKey | null {
    const actions = getActionsForStatus(status);
    return actions.find((key) => ACTION_CONFIG[key].tone === 'primary') ?? null;
}

function actionButtonStyle(tone: ActionTone, disabled: boolean) {
    if (disabled) {
        return {
            background: '#e5e7eb',
            color: '#6c757d',
            border: 'none',
        };
    }
    switch (tone) {
        case 'primary':
            return {
                background: '#0d0d0d',
                color: '#ffffff',
                border: 'none',
            };
        case 'danger':
            return {
                background: '#ffffff',
                color: '#842029',
                border: '1px solid #dc3545',
            };
        case 'warning':
            return {
                background: '#ffffff',
                color: '#664d03',
                border: '1px solid #ffc107',
            };
        default:
            return {
                background: '#ffffff',
                color: '#1a1a1a',
                border: '1px solid #d1d5db',
            };
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
    const { cancelAppointment, updateAppointmentStatus } =
        useAppointmentMutations();
    const [pendingActionId, setPendingActionId] = useState<number | null>(null);
    const [errorById, setErrorById] = useState<Record<number, string>>({});
    const [sheetAppointmentId, setSheetAppointmentId] = useState<number | null>(
        null,
    );
    const [nowTick, setNowTick] = useState(() => Date.now());
    const now = new Date(nowTick);

    const closeSheet = () => setSheetAppointmentId(null);
    const sheetAppointment =
        sheetAppointmentId !== null
            ? (appointments.find((a) => a.id === sheetAppointmentId) ?? null)
            : null;

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

    const runAction = async (
        appointment: Appointment,
        actionKey: ActionKey,
    ) => {
        const customerAlertSeverity = appointment.client?.id
            ? customerAlertSeverityByCustomerId[appointment.client.id]
            : undefined;

        // Finalize delegates to the drawer flow — opens, then receptionist
        // closes via the drawer's own save/cancel buttons. Sheet stays open
        // so the user sees their tap was registered.
        if (actionKey === 'finalize') {
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
            closeSheet();
            return;
        }

        setPendingActionId(appointment.id);
        setErrorById((current) => {
            const next = { ...current };
            delete next[appointment.id];
            return next;
        });

        try {
            switch (actionKey) {
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
                case 'start':
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
                case 'cancel':
                case 'reject':
                    await cancelAppointment.mutateAsync(appointment.id);
                    break;
                default:
                    return;
            }
            onChanged?.();
            closeSheet();
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
            <ul
                role="status"
                aria-live="polite"
                aria-label="Ładowanie wizyt"
                style={{
                    listStyle: 'none',
                    margin: 0,
                    padding: '0.75rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.625rem',
                }}
            >
                {[0, 1, 2, 3, 4].map((index) => (
                    <li key={index}>
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
                                borderLeftColor: '#e5e7eb',
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
                                <Skeleton width={60} height={22} />
                                <Skeleton width={88} height={18} radius={4} />
                            </div>
                            <Skeleton width="65%" height={18} />
                            <Skeleton width="45%" height={14} />
                            <Skeleton width="100%" height={44} radius={4} />
                        </article>
                    </li>
                ))}
                <span className="visually-hidden">Ładowanie wizyt...</span>
            </ul>
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
                const primaryKey = getPrimaryActionKey(status);
                const primaryLabel = primaryKey
                    ? ACTION_CONFIG[primaryKey].label
                    : null;
                const availableActions = getActionsForStatus(status);
                const hasMoreActions =
                    availableActions.filter((k) => k !== primaryKey).length > 0;
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
                            {primaryKey || hasMoreActions ? (
                                <div
                                    style={{
                                        display: 'flex',
                                        gap: '0.5rem',
                                        alignItems: 'stretch',
                                    }}
                                >
                                    {primaryKey && primaryLabel ? (
                                        <button
                                            type="button"
                                            disabled={isPending}
                                            onClick={() => {
                                                void runAction(
                                                    appointment,
                                                    primaryKey,
                                                );
                                            }}
                                            style={{
                                                flex: 1,
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
                                                : primaryLabel}
                                        </button>
                                    ) : null}
                                    {hasMoreActions ? (
                                        <button
                                            type="button"
                                            aria-label="Więcej akcji"
                                            onClick={() =>
                                                setSheetAppointmentId(
                                                    appointment.id,
                                                )
                                            }
                                            style={{
                                                minWidth: 56,
                                                minHeight: 44,
                                                padding: '0.625rem 0.75rem',
                                                background: '#ffffff',
                                                color: '#1a1a1a',
                                                border: '1px solid #d1d5db',
                                                borderRadius: 4,
                                                fontSize: '1.25rem',
                                                lineHeight: 1,
                                                cursor: 'pointer',
                                            }}
                                        >
                                            ⋯
                                        </button>
                                    ) : null}
                                </div>
                            ) : null}
                        </article>
                    </li>
                );
            })}
            {sheetAppointment ? (
                <SheetActionList
                    appointment={sheetAppointment}
                    availableActions={getActionsForStatus(
                        (sheetAppointment.status ?? 'scheduled') as string,
                    )}
                    isPending={pendingActionId === sheetAppointment.id}
                    onRun={(key) => {
                        void runAction(sheetAppointment, key);
                    }}
                    onClose={closeSheet}
                />
            ) : null}
        </ul>
    );
}

interface SheetActionListProps {
    appointment: Appointment;
    availableActions: ActionKey[];
    isPending: boolean;
    onRun: (key: ActionKey) => void;
    onClose: () => void;
}

function SheetActionList({
    appointment,
    availableActions,
    isPending,
    onRun,
    onClose,
}: SheetActionListProps) {
    const title =
        appointment.client?.name ?? appointment.service?.name ?? 'Akcje wizyty';

    return (
        <MobileBottomSheet open onClose={onClose} title={title}>
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.625rem',
                    paddingTop: '0.25rem',
                }}
            >
                {availableActions.length === 0 ? (
                    <p
                        style={{
                            margin: 0,
                            padding: '1rem 0.25rem',
                            fontSize: '0.875rem',
                            color: '#6c757d',
                            textAlign: 'center',
                        }}
                    >
                        Brak dostępnych akcji dla tej wizyty.
                    </p>
                ) : (
                    availableActions.map((key) => {
                        const config = ACTION_CONFIG[key];
                        const style = actionButtonStyle(config.tone, isPending);
                        return (
                            <button
                                key={key}
                                type="button"
                                disabled={isPending}
                                onClick={() => onRun(key)}
                                style={{
                                    minHeight: 48,
                                    padding: '0.75rem 1rem',
                                    borderRadius: 6,
                                    fontSize: '0.95rem',
                                    fontWeight: 600,
                                    letterSpacing: '0.02em',
                                    cursor: isPending
                                        ? 'not-allowed'
                                        : 'pointer',
                                    ...style,
                                }}
                            >
                                {config.label}
                            </button>
                        );
                    })
                )}
            </div>
        </MobileBottomSheet>
    );
}
