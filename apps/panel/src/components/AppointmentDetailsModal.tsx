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
    const date = new Date(a.startTime).toLocaleString();
    return (
        <Modal open={open} onClose={onClose}>
            <div className="space-y-2">
                <h3 className="text-lg font-semibold">Appointment #{a.id}</h3>
                <div className="text-sm text-gray-600">{date}</div>
                <div>Client: {a.client?.name ?? '-'}</div>
                <div>Service: {a.service?.name ?? '-'}</div>
                <div>
                    Employee: {a.employee?.fullName ?? a.employee?.name ?? '-'}
                </div>
                <div>Status: {a.paymentStatus ?? 'scheduled'}</div>
                <div className="flex gap-2 justify-end pt-2">
                    <button className="border px-2 py-1" onClick={onClose}>
                        Close
                    </button>
                    {canCancel && (
                        <button
                            className="border px-2 py-1"
                            onClick={() => {
                                if (a.id && onCancel) void onCancel(a.id);
                            }}
                        >
                            Cancel
                        </button>
                    )}
                    {canComplete && (
                        <button
                            className="border px-2 py-1"
                            onClick={() => {
                                if (a.id && onComplete) void onComplete(a.id);
                            }}
                        >
                            Complete
                        </button>
                    )}
                </div>
            </div>
        </Modal>
    );
}
