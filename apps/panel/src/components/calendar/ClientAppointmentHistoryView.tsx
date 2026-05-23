import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import type { Appointment } from '@/types';

const STATUS_LABELS: Record<string, string> = {
    scheduled: 'Zaplanowana',
    confirmed: 'Potwierdzona',
    in_progress: 'W trakcie',
    completed: 'Zakończona',
    cancelled: 'Anulowana',
    no_show: 'No-show',
    online_pending: 'Oczekuje na potwierdzenie',
    rescheduled_pending: 'Przeniesiona — wymaga akceptacji',
};

interface ClientAppointmentHistoryViewProps {
    currentDateParam: string;
    futureAppointments: Appointment[];
    archivedAppointments: Appointment[];
    onDateChange: (nextDate: Date) => void;
    onRequestCancellation?: (appointmentId: number) => Promise<void>;
    onAcceptReschedule?: (appointmentId: number) => Promise<void>;
}

function formatAppointmentDate(date: string): string {
    return new Date(date).toLocaleString('pl-PL', {
        dateStyle: 'medium',
        timeStyle: 'short',
    });
}

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
    const [requestState, setRequestState] = useState<{
        kind: 'success' | 'error';
        appointmentId: number;
        message: string;
    } | null>(null);

    const appointmentsById = useMemo(() => {
        const map = new Map<number, Appointment>();
        for (const appointment of futureAppointments) {
            map.set(appointment.id, appointment);
        }
        for (const appointment of archivedAppointments) {
            map.set(appointment.id, appointment);
        }
        return map;
    }, [futureAppointments, archivedAppointments]);

    const selectedAppointment = useMemo(() => {
        if (!selectedAppointmentId) return null;
        return appointmentsById.get(selectedAppointmentId) ?? null;
    }, [appointmentsById, selectedAppointmentId]);

    useEffect(() => {
        if (!selectedAppointmentId) return;
        if (appointmentsById.has(selectedAppointmentId)) return;
        setSelectedAppointmentId(null);
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
                    <div className="border rounded p-3 h-100">
                        <h3 className="h6 mb-2">Nadchodzące wizyty</h3>
                        {futureAppointments.length === 0 ? (
                            <p className="text-muted small mb-0">
                                Brak nadchodzących wizyt.
                            </p>
                        ) : (
                            <div className="d-flex flex-column gap-2">
                                {futureAppointments.map((appointment) => (
                                    <div
                                        key={appointment.id}
                                        className={`d-flex flex-column gap-2 border rounded p-2 ${
                                            appointment.status ===
                                                'online_pending' ||
                                            appointment.status ===
                                                'rescheduled_pending'
                                                ? 'border-warning'
                                                : ''
                                        }`}
                                    >
                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary btn-sm text-start"
                                            onClick={() =>
                                                setSelectedAppointmentId(
                                                    appointment.id,
                                                )
                                            }
                                        >
                                            {appointment.service?.name ??
                                                'Wizyta'}{' '}
                                            -{' '}
                                            {formatAppointmentDate(
                                                appointment.startTime,
                                            )}
                                        </button>
                                        {appointment.status && (
                                            <span
                                                className={`badge align-self-start ${
                                                    appointment.status ===
                                                        'online_pending' ||
                                                    appointment.status ===
                                                        'rescheduled_pending'
                                                        ? 'text-bg-warning'
                                                        : appointment.status ===
                                                            'confirmed'
                                                          ? 'text-bg-success'
                                                          : 'text-bg-secondary'
                                                }`}
                                            >
                                                {STATUS_LABELS[
                                                    appointment.status
                                                ] ?? appointment.status}
                                            </span>
                                        )}
                                        {appointment.status ===
                                            'rescheduled_pending' &&
                                        onAcceptReschedule ? (
                                            <button
                                                type="button"
                                                className="btn btn-success btn-sm align-self-start"
                                                onClick={() =>
                                                    void handleAcceptReschedule(
                                                        appointment.id,
                                                    )
                                                }
                                                disabled={
                                                    pendingAcceptId ===
                                                    appointment.id
                                                }
                                            >
                                                {pendingAcceptId ===
                                                appointment.id
                                                    ? 'Akceptowanie...'
                                                    : 'Zaakceptuj nowy termin'}
                                            </button>
                                        ) : null}
                                        {onRequestCancellation ? (
                                            <button
                                                type="button"
                                                className="btn btn-outline-danger btn-sm align-self-start"
                                                onClick={() =>
                                                    void handleRequestCancellation(
                                                        appointment.id,
                                                    )
                                                }
                                                disabled={
                                                    pendingRequestId ===
                                                    appointment.id
                                                }
                                            >
                                                {pendingRequestId ===
                                                appointment.id
                                                    ? 'Wysyłanie...'
                                                    : 'Poproś o anulowanie'}
                                            </button>
                                        ) : null}
                                        {requestState?.appointmentId ===
                                        appointment.id ? (
                                            <p
                                                className={`small mb-0 ${
                                                    requestState.kind ===
                                                    'success'
                                                        ? 'text-success'
                                                        : 'text-danger'
                                                }`}
                                            >
                                                {requestState.message}
                                            </p>
                                        ) : null}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
                <section className="col-12 col-lg-6">
                    <div className="border rounded p-3 h-100">
                        <h3 className="h6 mb-2">Historia wizyt</h3>
                        {archivedAppointments.length === 0 ? (
                            <p className="text-muted small mb-0">
                                Brak wizyt archiwalnych.
                            </p>
                        ) : (
                            <div className="d-flex flex-column gap-2">
                                {archivedAppointments.map((appointment) => (
                                    <button
                                        key={appointment.id}
                                        type="button"
                                        className="btn btn-outline-secondary btn-sm text-start"
                                        onClick={() =>
                                            setSelectedAppointmentId(
                                                appointment.id,
                                            )
                                        }
                                    >
                                        {appointment.service?.name ?? 'Wizyta'}{' '}
                                        -{' '}
                                        {formatAppointmentDate(
                                            appointment.startTime,
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            </div>
            <section
                className="border rounded p-3"
                data-testid="client-appointment-details"
            >
                <h3 className="h6 mb-2">Szczegóły wizyty (tylko odczyt)</h3>
                {selectedAppointment ? (
                    <dl className="row mb-0">
                        <dt className="col-sm-3">Usługa</dt>
                        <dd className="col-sm-9">
                            {selectedAppointment.service?.name ?? '-'}
                        </dd>
                        <dt className="col-sm-3">Status</dt>
                        <dd className="col-sm-9">
                            {STATUS_LABELS[
                                selectedAppointment.status ?? 'scheduled'
                            ] ??
                                selectedAppointment.status ??
                                'Zaplanowana'}
                        </dd>
                        <dt className="col-sm-3">Termin</dt>
                        <dd className="col-sm-9">
                            {formatAppointmentDate(
                                selectedAppointment.startTime,
                            )}
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
