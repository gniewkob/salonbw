import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { format, parseISO } from 'date-fns';
import { pl } from 'date-fns/locale';
import {
    CheckCircleIcon,
    ExclamationTriangleIcon,
    PlusIcon,
} from '@heroicons/react/20/solid';
import { useAuth } from '@/contexts/AuthContext';
import type { Appointment, Formula } from '@/types';

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

const CANCELLABLE_STATUSES = new Set([
    'scheduled',
    'confirmed',
    'online_pending',
    'rescheduled_pending',
]);

function AppointmentFormulas({ appointmentId }: { appointmentId: number }) {
    const { apiFetch } = useAuth();
    const [formulas, setFormulas] = useState<Formula[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        const fetch = async () => {
            try {
                const data = await apiFetch<Formula[]>(
                    `/formulas?appointmentId=${appointmentId}`,
                );
                if (mounted && Array.isArray(data)) setFormulas(data);
            } catch {
                // silently ignore — formulas may not exist
            } finally {
                if (mounted) setLoading(false);
            }
        };
        void fetch();
        return () => {
            mounted = false;
        };
    }, [apiFetch, appointmentId]);

    if (loading)
        return <p className="text-muted small mb-0">Ładowanie notatek…</p>;
    if (formulas.length === 0) return null;

    return (
        <div className="mt-2">
            <dt className="col-sm-3">Notatki zabiegu</dt>
            <dd className="col-sm-9">
                {formulas.map((f) => (
                    <div
                        key={f.id}
                        className="p-2 mb-1 rounded"
                        style={{
                            background: '#f8f9fa',
                            fontSize: '0.85rem',
                            whiteSpace: 'pre-wrap',
                        }}
                    >
                        {f.description}
                    </div>
                ))}
            </dd>
        </div>
    );
}

interface RescheduleModalProps {
    appointment: Appointment;
    onClose: () => void;
    onConfirm: (appointmentId: number) => Promise<void>;
}

function RescheduleModal({
    appointment,
    onClose,
    onConfirm,
}: RescheduleModalProps) {
    const router = useRouter();
    const [pending, setPending] = useState(false);
    const [done, setDone] = useState(false);

    const handleConfirm = async () => {
        setPending(true);
        try {
            await onConfirm(appointment.id);
            setDone(true);
        } finally {
            setPending(false);
        }
    };

    const handleGoToBooking = () => {
        const serviceId = appointment.service?.id;
        void router.push(
            serviceId ? `/booking?serviceId=${serviceId}` : '/booking',
        );
    };

    return (
        <div
            className="modal fade show d-block"
            tabIndex={-1}
            role="dialog"
            style={{ background: 'rgba(0,0,0,0.5)' }}
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="modal-dialog modal-dialog-centered" role="document">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Zmiana terminu wizyty</h5>
                        <button
                            type="button"
                            className="btn-close"
                            aria-label="Zamknij"
                            onClick={onClose}
                        />
                    </div>
                    <div className="modal-body">
                        {done ? (
                            <div>
                                <p className="text-success mb-3">
                                    Prośba o zmianę terminu została wysłana.
                                    Recepcja skontaktuje się z Tobą w celu
                                    ustalenia nowego terminu.
                                </p>
                                <p className="text-muted small">
                                    Możesz też od razu zarezerwować nowy termin
                                    dla tej samej usługi:
                                </p>
                                <button
                                    type="button"
                                    className="btn btn-salon btn-sm"
                                    onClick={handleGoToBooking}
                                >
                                    Zarezerwuj nowy termin
                                </button>
                            </div>
                        ) : (
                            <div>
                                <p>
                                    Chcesz zmienić termin wizyty{' '}
                                    <strong>
                                        {appointment.service?.name ?? 'Wizyta'}
                                    </strong>{' '}
                                    ({formatMeta(appointment.startTime)})?
                                </p>
                                <p className="text-muted small mb-0">
                                    Wyślemy prośbę o zmianę terminu do recepcji.
                                    Możesz też od razu anulować tę wizytę i
                                    zarezerwować nowy termin.
                                </p>
                            </div>
                        )}
                    </div>
                    {!done && (
                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-outline-secondary btn-sm"
                                onClick={onClose}
                            >
                                Zamknij
                            </button>
                            <button
                                type="button"
                                className="btn btn-outline-primary btn-sm"
                                onClick={handleGoToBooking}
                            >
                                Zarezerwuj nowy termin
                            </button>
                            <button
                                type="button"
                                className="btn btn-salon btn-sm"
                                disabled={pending}
                                onClick={() => void handleConfirm()}
                            >
                                {pending
                                    ? 'Wysyłanie…'
                                    : 'Wyślij prośbę o zmianę'}
                            </button>
                        </div>
                    )}
                    {done && (
                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-outline-secondary btn-sm"
                                onClick={onClose}
                            >
                                Zamknij
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
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
    const { apiFetch } = useAuth();
    const [selectedAppointmentId, setSelectedAppointmentId] = useState<
        number | null
    >(null);
    const [rescheduleAppt, setRescheduleAppt] = useState<Appointment | null>(
        null,
    );
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

    const handleRescheduleRequest = async (appointmentId: number) => {
        await apiFetch(`/appointments/${appointmentId}/reschedule-request`, {
            method: 'POST',
        });
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
            CANCELLABLE_STATUSES.has(status);

        const isError = requestState?.kind === 'error';
        const FeedbackIcon = isError
            ? ExclamationTriangleIcon
            : CheckCircleIcon;

        return (
            <article
                key={appointment.id}
                className={`salonbw-reception-item${isSelected ? ' salonbw-reception-item--selected' : ''}`}
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
                        className="btn btn-outline-secondary"
                        aria-expanded={isSelected}
                        aria-controls="client-appointment-details"
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
                            className="btn btn-success"
                            onClick={() =>
                                void handleAcceptReschedule(appointment.id)
                            }
                            disabled={pendingAcceptId === appointment.id}
                            aria-busy={pendingAcceptId === appointment.id}
                        >
                            {pendingAcceptId === appointment.id
                                ? 'Akceptowanie...'
                                : 'Zaakceptuj nowy termin'}
                        </button>
                    ) : null}
                    {allowCancel && CANCELLABLE_STATUSES.has(status) ? (
                        <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => setRescheduleAppt(appointment)}
                        >
                            Zmień termin
                        </button>
                    ) : null}
                    {canCancel ? (
                        <button
                            type="button"
                            className="btn btn-outline-danger"
                            onClick={() =>
                                void handleRequestCancellation(appointment.id)
                            }
                            disabled={pendingRequestId === appointment.id}
                            aria-busy={pendingRequestId === appointment.id}
                        >
                            {pendingRequestId === appointment.id
                                ? 'Wysyłanie...'
                                : 'Poproś o anulowanie'}
                        </button>
                    ) : null}
                </div>
                {requestState?.appointmentId === appointment.id ? (
                    <p
                        className={`client-history-feedback ${
                            isError ? 'text-danger' : 'text-success'
                        }`}
                        role={isError ? 'alert' : 'status'}
                        aria-live={isError ? 'assertive' : 'polite'}
                    >
                        <FeedbackIcon aria-hidden="true" />
                        <span>{requestState.message}</span>
                    </p>
                ) : null}
            </article>
        );
    };

    const goToBooking = () => void router.push('/booking');

    return (
        <div className="d-flex flex-column gap-3">
            <div className="d-flex justify-content-between align-items-center">
                <h2 className="h5 mb-0">Twoje wizyty</h2>
                <button
                    type="button"
                    className="btn btn-salon d-inline-flex align-items-center gap-1"
                    onClick={goToBooking}
                >
                    <PlusIcon
                        aria-hidden="true"
                        style={{ width: 16, height: 16 }}
                    />
                    Zarezerwuj wizytę
                </button>
            </div>
            <div className="d-flex flex-wrap align-items-end gap-3 rounded border bg-white p-2">
                <div>
                    <label
                        className="form-label mb-1"
                        htmlFor="client-calendar-date"
                    >
                        Data referencyjna
                    </label>
                    <input
                        id="client-calendar-date"
                        type="date"
                        className="form-control"
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
                        <div>
                            <p className="text-muted small mb-2">
                                Brak nadchodzących wizyt.
                            </p>
                            <button
                                type="button"
                                className="btn btn-outline-secondary"
                                onClick={goToBooking}
                            >
                                Zarezerwuj pierwszą wizytę
                            </button>
                        </div>
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
                    <>
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
                        <AppointmentFormulas
                            appointmentId={selectedAppointment.id}
                        />
                    </>
                ) : (
                    <p className="text-muted small mb-0">
                        Wybierz wizytę z listy, aby zobaczyć szczegóły.
                    </p>
                )}
            </section>
            {rescheduleAppt && (
                <RescheduleModal
                    appointment={rescheduleAppt}
                    onClose={() => setRescheduleAppt(null)}
                    onConfirm={handleRescheduleRequest}
                />
            )}
        </div>
    );
}
