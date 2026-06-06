import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { pl } from 'date-fns/locale';
import type { Appointment, AppointmentStatus, CalendarEvent } from '@/types';
import { useAppointmentMutations } from '@/hooks/useAppointments';
import ConfirmModal from '@/components/ConfirmModal';
import FinalizationModal from './FinalizationModal';

interface Props {
    open: boolean;
    event: CalendarEvent | null;
    appointment: Appointment | null;
    onClose: () => void;
    onOpenFull: () => void;
    onChanged: () => void;
}

type ActionKey = 'start' | 'finalize' | 'no_show' | 'cancel';

const STATUS_LABELS: Record<string, string> = {
    scheduled: 'Zaplanowana',
    confirmed: 'Potwierdzona',
    in_progress: 'W trakcie',
    completed: 'Zakończona',
    cancelled: 'Anulowana',
    no_show: 'No-show',
    online_pending: 'Oczekuje online',
    rescheduled_pending: 'Zmiana terminu',
};

const STATUS_BADGE: Record<string, string> = {
    scheduled: 'bg-secondary bg-opacity-10 text-body',
    confirmed: 'badge text-bg-primary',
    in_progress: 'badge text-bg-info',
    completed: 'badge text-bg-success',
    cancelled: 'badge text-bg-danger',
    no_show: 'badge text-bg-warning',
    online_pending: 'badge text-bg-warning',
    rescheduled_pending: 'badge text-bg-warning',
};

const STATUS_ACTIONS: Record<string, ActionKey[]> = {
    scheduled: ['start', 'no_show', 'cancel'],
    confirmed: ['start', 'no_show', 'cancel'],
    in_progress: ['finalize', 'cancel'],
    online_pending: ['cancel'],
    rescheduled_pending: ['cancel'],
    completed: [],
    cancelled: [],
    no_show: [],
};

const ACTION_CONFIG: Record<
    ActionKey,
    { label: string; btnClass: string; nextStatus?: AppointmentStatus }
> = {
    start: {
        label: 'Rozpocznij',
        btnClass: 'btn btn-primary btn-sm',
        nextStatus: 'in_progress',
    },
    finalize: {
        label: 'Finalizuj',
        btnClass: 'btn btn-success btn-sm',
    },
    no_show: {
        label: 'No-show',
        btnClass: 'btn btn-warning btn-sm',
        nextStatus: 'no_show',
    },
    cancel: {
        label: 'Anuluj wizytę',
        btnClass: 'btn btn-outline-danger btn-sm',
    },
};

export default function AppointmentQuickModal({
    open,
    event,
    appointment,
    onClose,
    onOpenFull,
    onChanged,
}: Props) {
    const { cancelAppointment, updateAppointmentStatus } =
        useAppointmentMutations();
    const [busy, setBusy] = useState(false);
    const [finalizationOpen, setFinalizationOpen] = useState(false);
    const [confirmPending, setConfirmPending] = useState<
        'cancel' | 'no_show' | null
    >(null);

    if (!open || !event) return null;

    const status = event.status ?? 'scheduled';
    const actions = STATUS_ACTIONS[status] ?? [];

    const startDt = parseISO(event.startTime);
    const endDt = parseISO(event.endTime);
    const dateStr = format(startDt, 'EEEE, d MMMM yyyy', { locale: pl });
    const timeStr = `${format(startDt, 'HH:mm')} – ${format(endDt, 'HH:mm')}`;
    const durationMin = Math.round(
        (endDt.getTime() - startDt.getTime()) / 60_000,
    );

    const executeAction = async (action: ActionKey) => {
        if (!appointment) return;
        setBusy(true);
        try {
            if (action === 'cancel') {
                await cancelAppointment.mutateAsync(appointment.id);
            } else if (action !== 'finalize') {
                await updateAppointmentStatus.mutateAsync({
                    id: appointment.id,
                    status: ACTION_CONFIG[action].nextStatus ?? 'scheduled',
                });
            }
            onChanged();
            onClose();
        } finally {
            setBusy(false);
        }
    };

    const handleAction = (action: ActionKey) => {
        if (action === 'finalize') {
            setFinalizationOpen(true);
            return;
        }
        if (action === 'cancel' || action === 'no_show') {
            setConfirmPending(action);
            return;
        }
        void executeAction(action);
    };

    return (
        <>
            <div
                className="position-fixed top-0 start-0 bottom-0 end-0 d-flex align-items-center justify-content-center p-3"
                style={{
                    zIndex: 1200,
                    background: 'rgba(0,0,0,0.55)',
                    backdropFilter: 'blur(4px)',
                }}
                onClick={onClose}
            >
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label="Podgląd wizyty"
                    className="bg-white rounded-4 overflow-hidden"
                    style={{
                        width: 'min(480px, 100%)',
                        boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
                        border: '1px solid rgba(0,0,0,0.08)',
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="d-flex align-items-center justify-content-between px-4 pt-4 pb-3 border-bottom">
                        <div>
                            <div className="fw-semibold fs-6 text-dark">
                                {event.title}
                            </div>
                            {event.clientName && (
                                <div className="small text-muted mt-1">
                                    {event.clientName}
                                </div>
                            )}
                        </div>
                        <span
                            className={`px-2 py-1 small rounded-3 ${STATUS_BADGE[status] ?? 'badge text-bg-secondary'}`}
                        >
                            {STATUS_LABELS[status] ?? status}
                        </span>
                    </div>

                    {/* Details */}
                    <div className="px-4 py-3 d-flex flex-column gap-2">
                        <div className="d-flex align-items-center gap-2 small text-muted">
                            <svg
                                style={{ width: '1rem', height: '1rem' }}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                            </svg>
                            <span className="text-capitalize">{dateStr}</span>
                        </div>
                        <div className="d-flex align-items-center gap-2 small text-muted">
                            <svg
                                style={{ width: '1rem', height: '1rem' }}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                            <span>
                                {timeStr} ({durationMin} min)
                            </span>
                        </div>
                        <div className="d-flex align-items-center gap-2 small text-muted">
                            <svg
                                style={{ width: '1rem', height: '1rem' }}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                />
                            </svg>
                            <span>{event.employeeName}</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="px-4 pb-4 d-flex flex-wrap justify-content-between gap-2">
                        <div className="d-flex flex-wrap gap-2">
                            {actions.map((action) => (
                                <button
                                    key={action}
                                    type="button"
                                    className={ACTION_CONFIG[action].btnClass}
                                    disabled={busy}
                                    onClick={() => handleAction(action)}
                                >
                                    {ACTION_CONFIG[action].label}
                                </button>
                            ))}
                        </div>
                        <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm ms-auto"
                            onClick={onOpenFull}
                        >
                            Otwórz szczegóły
                        </button>
                    </div>
                </div>
            </div>

            <ConfirmModal
                open={confirmPending !== null}
                title={
                    confirmPending === 'cancel'
                        ? 'Anulować wizytę?'
                        : 'Oznaczyć jako nieobecność?'
                }
                message={`${event.clientName ?? 'Klient'} — ${event.title}. Operacja jest nieodwracalna.`}
                confirmLabel={
                    confirmPending === 'cancel'
                        ? 'Anuluj wizytę'
                        : 'Oznacz no-show'
                }
                confirmVariant={
                    confirmPending === 'cancel' ? 'danger' : 'warning'
                }
                onCancel={() => setConfirmPending(null)}
                onConfirm={() => {
                    if (!confirmPending) return;
                    void executeAction(confirmPending);
                    setConfirmPending(null);
                }}
            />

            {appointment && (
                <FinalizationModal
                    open={finalizationOpen}
                    appointment={appointment}
                    onClose={() => setFinalizationOpen(false)}
                    onSuccess={() => {
                        setFinalizationOpen(false);
                        onChanged();
                        onClose();
                    }}
                />
            )}
        </>
    );
}
