import Modal from '@/components/Modal';
import { Appointment } from '@/types';

interface Props {
    open: boolean;
    onClose: () => void;
    appointment: Appointment | null;
    canCancel?: boolean;
    canComplete?: boolean;
    onCancel?: (id: number) => Promise<void> | void;
    onComplete?: (id: number) => Promise<void> | void;
}

export default function AppointmentDetailsModal({
    open,
    onClose,
    appointment,
    canCancel = false,
    canComplete = false,
    onCancel,
    onComplete,
}: Props) {
    if (!appointment) return null;
    const a = appointment;
    const date = new Date(a.startTime).toLocaleString('pl-PL');
    const statusLabel =
        a.paymentStatus === 'paid'
            ? 'opłacona'
            : a.paymentStatus === 'pending'
              ? 'oczekuje na płatność'
              : a.paymentStatus === 'refunded'
                ? 'zwrócona'
                : 'zaplanowana';
    return (
        <Modal open={open} onClose={onClose}>
            <div className="gap-2">
                <h3 className="fs-5 fw-semibold">Wizyta #{a.id}</h3>
                <div className="small text-muted">{date}</div>
                <div>Klient: {a.customer?.name ?? '-'}</div>
                <div>Usługa: {a.service?.name ?? '-'}</div>
                <div>
                    Pracownik: {a.employee?.fullName ?? a.employee?.name ?? '-'}
                </div>
                <div>Status: {statusLabel}</div>
                <div className="d-flex gap-2 justify-content-end pt-2">
                    <button className="border px-2 py-1" onClick={onClose}>
                        Zamknij
                    </button>
                    {canCancel && (
                        <button
                            className="border px-2 py-1"
                            onClick={() => {
                                if (a.id && onCancel) void onCancel(a.id);
                            }}
                        >
                            Anuluj
                        </button>
                    )}
                    {canComplete && (
                        <button
                            className="border px-2 py-1"
                            onClick={() => {
                                if (a.id && onComplete) void onComplete(a.id);
                            }}
                        >
                            Zakończ
                        </button>
                    )}
                </div>
            </div>
        </Modal>
    );
}
