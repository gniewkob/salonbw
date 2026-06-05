import type { Appointment } from '@/types';
import {
    getAppointmentCustomerId,
    trackReceptionAction,
} from '../receptionTelemetry';

interface Props {
    mode: 'create' | 'edit';
    saving: boolean;
    canSaveCreate: boolean;
    startTime: string;
    appointment: Appointment | null | undefined;
    isOnlinePending: boolean;
    isRescheduledPending: boolean;
    canConfirm: boolean;
    canStart: boolean;
    canNoShow: boolean;
    canCancel: boolean;
    canComplete: boolean;
    customerAlertSeverity: 'info' | 'warning' | 'danger' | undefined;
    onClose: () => void;
    handleCreate: () => void;
    handleUpdate: () => void;
    handleCancel: () => void;
    handleStatusChange: (status: 'confirmed' | 'in_progress' | 'no_show') => void;
    setFinalizationOpen: (v: boolean) => void;
    isMobile: boolean;
}

export default function ActionsSection({
    mode,
    saving,
    canSaveCreate,
    startTime,
    appointment,
    isOnlinePending,
    isRescheduledPending,
    canConfirm,
    canStart,
    canNoShow,
    canCancel,
    canComplete,
    customerAlertSeverity,
    onClose,
    handleCreate,
    handleUpdate,
    handleCancel,
    handleStatusChange,
    setFinalizationOpen,
    isMobile,
}: Props) {
    return (
        <>
            <div className="rounded border p-2">
                <strong className="d-block mb-2">Akcje</strong>
                <div className="d-flex flex-wrap gap-2">
                    {mode === 'create' ? (
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={handleCreate}
                            disabled={!canSaveCreate || saving}
                        >
                            {saving ? 'Zapisywanie…' : 'Utwórz wizytę'}
                        </button>
                    ) : (
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={handleUpdate}
                            disabled={saving || !startTime}
                        >
                            {saving ? 'Zapisywanie…' : 'Zapisz zmiany'}
                        </button>
                    )}

                    {mode === 'edit' && appointment?.id && (
                        <>
                            {isOnlinePending && (
                                <div className="alert alert-warning py-2 mb-2 d-flex align-items-center gap-2">
                                    <strong>Rezerwacja online</strong> — czeka na potwierdzenie przez salon
                                </div>
                            )}
                            {isRescheduledPending && (
                                <div className="alert alert-info py-2 mb-2 d-flex align-items-center gap-2">
                                    <strong>Zmiana terminu</strong> — czeka na akceptację klienta
                                </div>
                            )}
                            {canConfirm && (
                                <button
                                    type="button"
                                    className={`btn ${isOnlinePending ? 'btn-success' : 'btn-outline-primary'}`}
                                    onClick={() => handleStatusChange('confirmed')}
                                    disabled={saving}
                                >
                                    {isOnlinePending
                                        ? 'Potwierdź rezerwację'
                                        : isRescheduledPending
                                          ? 'Zaakceptuj nowy termin'
                                          : 'Potwierdź'}
                                </button>
                            )}
                            {isOnlinePending && (
                                <button type="button" className="btn btn-outline-danger" onClick={handleCancel} disabled={saving}>
                                    Odrzuć rezerwację
                                </button>
                            )}
                            {isRescheduledPending && (
                                <button type="button" className="btn btn-outline-danger" onClick={handleCancel} disabled={saving}>
                                    Anuluj wizytę
                                </button>
                            )}
                            {canStart && (
                                <button type="button" className="btn btn-outline-secondary" onClick={() => handleStatusChange('in_progress')} disabled={saving}>
                                    Rozpocznij
                                </button>
                            )}
                            {canNoShow && (
                                <button type="button" className="btn btn-outline-warning" onClick={() => handleStatusChange('no_show')} disabled={saving}>
                                    No-show
                                </button>
                            )}
                            {canComplete && (
                                <button
                                    type="button"
                                    className="btn btn-outline-success"
                                    onClick={() => {
                                        trackReceptionAction({
                                            action: 'finalize_via_drawer',
                                            appointmentId: appointment.id,
                                            customerId: getAppointmentCustomerId(appointment),
                                            customerAlertSeverity,
                                            source: 'appointment_drawer',
                                        });
                                        setFinalizationOpen(true);
                                    }}
                                    disabled={saving}
                                >
                                    Finalizuj wizytę
                                </button>
                            )}
                            {canCancel && (
                                <button type="button" className="btn btn-outline-danger" onClick={handleCancel} disabled={saving}>
                                    Anuluj wizytę
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>

            {isMobile && (
                <div
                    style={{
                        flexShrink: 0,
                        display: 'flex',
                        gap: '0.5rem',
                        padding: '0.75rem 0.875rem',
                        paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))',
                        borderTop: '1px solid #e5e7eb',
                        background: '#ffffff',
                    }}
                >
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        style={{
                            flex: 1,
                            minHeight: 48,
                            background: '#ffffff',
                            color: '#1a1a1a',
                            border: '1px solid #d1d5db',
                            borderRadius: 6,
                            fontSize: '0.95rem',
                            fontWeight: 600,
                            cursor: saving ? 'not-allowed' : 'pointer',
                        }}
                    >
                        Anuluj
                    </button>
                    <button
                        type="button"
                        disabled={mode === 'create' ? !canSaveCreate || saving : saving || !startTime}
                        onClick={() => { if (mode === 'create') { handleCreate(); } else { handleUpdate(); } }}
                        style={{
                            flex: 2,
                            minHeight: 48,
                            background: saving ? '#e5e7eb' : '#0d0d0d',
                            color: saving ? '#6c757d' : '#ffffff',
                            border: 'none',
                            borderRadius: 6,
                            fontSize: '0.95rem',
                            fontWeight: 700,
                            letterSpacing: '0.04em',
                            textTransform: 'uppercase',
                            cursor: saving ? 'not-allowed' : 'pointer',
                        }}
                    >
                        {saving ? 'Zapisywanie...' : mode === 'create' ? 'Utwórz' : 'Zapisz'}
                    </button>
                </div>
            )}
        </>
    );
}
