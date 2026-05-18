import { useEffect, useMemo, useState } from 'react';
import type { Appointment } from '@/types';

interface ClientAppointmentHistoryViewProps {
    currentDateParam: string;
    futureAppointments: Appointment[];
    archivedAppointments: Appointment[];
    onDateChange: (nextDate: Date) => void;
    onRequestCancellation?: (appointmentId: number) => Promise<void>;
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
}: ClientAppointmentHistoryViewProps) {
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
                    'Prosba o anulowanie zostala zapisana. Recepcja skontaktuje sie z Toba.',
            });
        } catch {
            setRequestState({
                kind: 'error',
                appointmentId,
                message:
                    'Nie udalo sie wyslac prosby o anulowanie. Sprobuj ponownie.',
            });
        } finally {
            setPendingRequestId(null);
        }
    };

    return (
        <div className="d-flex flex-column gap-3">
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
                    <div className="border rounded bg-white p-3 h-100">
                        <h3 className="h6 mb-2">Nadchodzace wizyty</h3>
                        {futureAppointments.length === 0 ? (
                            <p className="text-muted small mb-0">
                                Brak nadchodzacych wizyt.
                            </p>
                        ) : (
                            <div className="d-flex flex-column gap-2">
                                {futureAppointments.map((appointment) => (
                                    <div
                                        key={appointment.id}
                                        className="d-flex flex-column gap-2 border rounded p-2"
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
                                                    ? 'Wysylanie...'
                                                    : 'Popros o anulowanie'}
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
                    <div className="border rounded bg-white p-3 h-100">
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
                className="border rounded bg-white p-3"
                data-testid="client-appointment-details"
            >
                <h3 className="h6 mb-2">Szczegoly wizyty (tylko odczyt)</h3>
                {selectedAppointment ? (
                    <dl className="row mb-0">
                        <dt className="col-sm-3">Usluga</dt>
                        <dd className="col-sm-9">
                            {selectedAppointment.service?.name ?? '-'}
                        </dd>
                        <dt className="col-sm-3">Status</dt>
                        <dd className="col-sm-9">
                            {selectedAppointment.status ?? 'scheduled'}
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
                        Wybierz wizyte z listy, aby zobaczyc szczegoly.
                    </p>
                )}
            </section>
        </div>
    );
}
