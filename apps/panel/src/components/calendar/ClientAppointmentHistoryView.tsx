import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { format, parseISO } from 'date-fns';
import { pl } from 'date-fns/locale';
import type { Appointment } from '@/types';

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
    scheduled: {
        label: 'Zaplanowana',
        className: 'salonbw-status--scheduled',
    },
    confirmed: {
        label: 'Potwierdzona',
        className: 'salonbw-status--confirmed',
    },
    in_progress: {
        label: 'W trakcie',
        className: 'salonbw-status--in-progress',
    },
    completed: {
        label: 'Zakończona',
        className: 'salonbw-status--completed',
    },
    cancelled: {
        label: 'Anulowana',
        className: 'salonbw-status--cancelled',
    },
    no_show: {
        label: 'No-show',
        className: 'salonbw-status--no-show',
    },
    online_pending: {
        label: 'Oczekuje na potwierdzenie',
        className: 'salonbw-status--online_pending',
    },
    rescheduled_pending: {
        label: 'Przeniesiona — wymaga akceptacji',
        className: 'salonbw-status--rescheduled_pending',
    },
};

const DEFAULT_STATUS = STATUS_CONFIG.scheduled;

interface ClientAppointmentHistoryViewProps {
    currentDateParam: string;
    futureAppointments: Appointment[];
    archivedAppointments: Appointment[];
    onDateChange: (nextDate: Date) => void;
    onRequestCancellation?: (appointmentId: number) => Promise<void>;
    onAcceptReschedule?: (appointmentId: number) => Promise<void>;
}

function formatMeta(isoDate: string): string {
    return format(parseISO(isoDate), 'd MMM yyyy, HH:mm', { locale: pl });
}

const TERMINAL_STATUSES = new Set(['cancelled', 'completed', 'no_show']);

export default function ClientAppointmentHistoryView({
    currentDateParam,
    futureAppointments,
    archivedAppointments,
    onDateChange,
    onRequestCancellation,
    onAcceptReschedule,
}: ClientAppointmentHistoryViewProps) {
    const router = useRouter();
    const [selectedAppointmentId, setSelectedAppointmentId] = useState<
        number | null
    >(null);
    const [pendingRequestId, setPendingRequestId] = useState<number | null>(
        null,
    );
    const [pendingAcceptId, setPendingAcceptId] = useState<number | null>(null);
    const [requestState, setRequestState] = useState<{
        kind: 'success' | 'error';
        appointmentId: number;
        message: string;
    } | null>(null);

    const appointmentsById = useMemo(() => {
        const map = new Map<number, Appointment>();
        for (const a of futureAppointments) map.set(a.id, a);
        for (const a of archivedAppointments) map.set(a.id, a);
        return map;
    }, [futureAppointments, archivedAppointments]);

    const selectedAppointment = useMemo(
        () =>
            selectedAppointmentId
                ? (appointmentsById.get(selectedAppointmentId) ?? null)
                : null,
        [appointmentsById, selectedAppointmentId],
    );

    useEffect(() => {
        if (
            selectedAppointmentId &&
            !appointmentsById.has(selectedAppointmentId)
        ) {
            setSelectedAppointmentId(null);
        }
    }, [appointmentsById, selectedAppointmentId]);

    const handleAcceptReschedule = async (appointmentId: number) => {
        if (!onAcceptReschedule) return;
        setPendingAcceptId(appointmentId);
        try {
            await onAcceptReschedule(appointmentId);
        } finally {
            setPendingAcceptId(null);
        }
    };

    const handleRequestCancellation = async (appointmentId: number) => {
        if (!onRequestCancellation) return;
        setPendingRequestId(appointmentId);
        setRequestState(null);
        try {
            await onRequestCancellation(appointmentId);
            setRequestState({
                kind: 'success',
                appointmentId,
                message:
                    'Prośba o anulowanie została zapisana. Recepcja skontaktuje się z Tobą.',
            });
        } catch {
            setRequestState({
                kind: 'error',
                appointmentId,
                message:
                    'Nie udało się wysłać prośby o anulowanie. Spróbuj ponownie.',
            });
        } finally {
            setPendingRequestId(null);
        }
    };

    const renderCard = (appointment: Appointment, allowCancel: boolean) => {
        const status = appointment.status ?? 'scheduled';
        const statusCfg = STATUS_CONFIG[status] ?? DEFAULT_STATUS;
        const isSelected = selectedAppointmentId === appointment.id;
        const canCancel =
            allowCancel &&
            !!onRequestCancellation &&
            !TERMINAL_STATUSES.has(status);

        return (
            <article
                key={appointment.id}
                className="salonbw-reception-item"
                style={isSelected ? { borderColor: '#0d6efd' } : undefined}
            >
                <div className="salonbw-reception-item__header">
                    <div>
                        <h4 className="salonbw-reception-item__title">
                            {appointment.service?.name ?? 'Wizyta'}
                        </h4>
                        <div className="salonbw-reception-item__meta">
                            <span>{formatMeta(appointment.startTime)}</span>
                        </div>
                    </div>
                    <span
                        className={`salonbw-status-badge ${statusCfg.className}`}
                    >
                        {statusCfg.label}
                    </span>
                </div>
                {appointment.employee?.name && (
                    <div className="salonbw-reception-item__details">
                        {appointment.employee.name}
                    </div>
                )}
                <div className="salonbw-reception-item__actions">
                    <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() =>
                            setSelectedAppointmentId(
                                isSelected ? null : appointment.id,
                            )
                        }
                    >
                        {isSelected ? 'Ukryj' : 'Szczegóły'}
                    </button>
                    {appointment.status === 'rescheduled_pending' &&
                    onAcceptReschedule ? (
                        <button
                            type="button"
                            className="btn btn-sm btn-success"
                            onClick={() =>
                                void handleAcceptReschedule(appointment.id)
                            }
                            disabled={pendingAcceptId === appointment.id}
                        >
                            {pendingAcceptId === appointment.id
                                ? 'Akceptowanie...'
                                : 'Zaakceptuj nowy termin'}
                        </button>
                    ) : null}
                    {canCancel ? (
                        <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() =>
                                void handleRequestCancellation(appointment.id)
                            }
                            disabled={pendingRequestId === appointment.id}
                        >
                            {pendingRequestId === appointment.id
                                ? 'Wysyłanie...'
                                : 'Poproś o anulowanie'}
                        </button>
                    ) : null}
                </div>
                {requestState?.appointmentId === appointment.id ? (
                    <p
                        className={`small mb-0 mt-2 ${
                            requestState.kind === 'success'
                                ? 'text-success'
                                : 'text-danger'
                        }`}
                    >
                        {requestState.message}
                    </p>
                ) : null}
            </article>
        );
    };

    return (
        <div className="d-flex flex-column gap-3">
            <div className="d-flex justify-content-between align-items-center">
                <h2 className="h5 mb-0">Twoje wizyty</h2>
                <button
                    type="button"
                    className="btn btn-salon btn-sm"
                    onClick={() => void router.push('/booking')}
                >
                    + Zarezerwuj wizytę
                </button>
            </div>
            <div className="d-flex flex-wrap align-items-end gap-3 rounded border bg-white p-2">
                <div>
                    <label
                        className="form-label form-label-sm mb-1"
                        htmlFor="client-calendar-date"
                    >
                        Data referencyjna
                    </label>
                    <input
                        id="client-calendar-date"
                        type="date"
                        className="form-control form-control-sm"
                        value={currentDateParam}
                        onChange={(event) => {
                            const nextDate = new Date(
                                `${event.target.value}T00:00:00`,
                            );
                            if (Number.isNaN(nextDate.getTime())) return;
                            onDateChange(nextDate);
                        }}
                    />
                </div>
            </div>
            <div className="row g-3">
                <section className="col-12 col-lg-6">
                    <h3 className="h6 mb-2">Nadchodzące wizyty</h3>
                    {futureAppointments.length === 0 ? (
                        <p className="text-muted small mb-0">
                            Brak nadchodzących wizyt.
                        </p>
                    ) : (
                        <div className="salonbw-reception-list">
                            {futureAppointments.map((a) => renderCard(a, true))}
                        </div>
                    )}
                </section>
                <section className="col-12 col-lg-6">
                    <h3 className="h6 mb-2">Historia wizyt</h3>
                    {archivedAppointments.length === 0 ? (
                        <p className="text-muted small mb-0">
                            Brak wizyt archiwalnych.
                        </p>
                    ) : (
                        <div className="salonbw-reception-list">
                            {archivedAppointments.map((a) =>
                                renderCard(a, false),
                            )}
                        </div>
                    )}
                </section>
            </div>
            <section
                className="salonbw-reception-item"
                data-testid="client-appointment-details"
            >
                <h3 className="h6 mb-2">Szczegóły wizyty (tylko odczyt)</h3>
                {selectedAppointment ? (
                    <dl className="row mb-0 small">
                        <dt className="col-sm-3">Usługa</dt>
                        <dd className="col-sm-9">
                            {selectedAppointment.service?.name ?? '-'}
                        </dd>
                        <dt className="col-sm-3">Status</dt>
                        <dd className="col-sm-9">
                            {
                                (
                                    STATUS_CONFIG[
                                        selectedAppointment.status ??
                                            'scheduled'
                                    ] ?? DEFAULT_STATUS
                                ).label
                            }
                        </dd>
                        <dt className="col-sm-3">Termin</dt>
                        <dd className="col-sm-9">
                            {formatMeta(selectedAppointment.startTime)}
                        </dd>
                        <dt className="col-sm-3">Pracownik</dt>
                        <dd className="col-sm-9">
                            {selectedAppointment.employee?.name ?? '-'}
                        </dd>
                    </dl>
                ) : (
                    <p className="text-muted small mb-0">
                        Wybierz wizytę z listy, aby zobaczyć szczegóły.
                    </p>
                )}
            </section>
        </div>
    );
}
