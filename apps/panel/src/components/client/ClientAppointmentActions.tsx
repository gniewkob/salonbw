import PanelButton from '@/components/ui/PanelButton';
import StatusBadge from '@/components/ui/StatusBadge';
import {
    appointmentStatusLabel,
    appointmentStatusTone,
} from '@/lib/appointmentStatus';

export const CLIENT_CANCELLABLE_STATUSES = new Set([
    'scheduled',
    'confirmed',
    'online_pending',
    'rescheduled_pending',
]);

export const CLIENT_ARCHIVE_STATUSES = new Set([
    'completed',
    'cancelled',
    'no_show',
]);

interface ClientAppointmentActionsProps {
    accepting?: boolean;
    acceptLabel?: string;
    cancelling?: boolean;
    canAccept?: boolean;
    canCancel?: boolean;
    className?: string;
    onAccept?: () => void;
    onCancel?: () => void;
    serviceId?: number;
    showRebook?: boolean;
    status?: string | null;
}

export default function ClientAppointmentActions({
    accepting = false,
    acceptLabel = 'Akceptuj nowy termin',
    cancelling = false,
    canAccept,
    canCancel,
    className,
    onAccept,
    onCancel,
    serviceId,
    showRebook = false,
    status,
}: ClientAppointmentActionsProps) {
    const normalizedStatus = status ?? '';
    const shouldShowAccept =
        canAccept ?? normalizedStatus === 'rescheduled_pending';
    const shouldShowCancel =
        canCancel ?? CLIENT_CANCELLABLE_STATUSES.has(normalizedStatus);
    const shouldShowRebook = showRebook && typeof serviceId === 'number';

    return (
        <div
            className={['d-flex align-items-center gap-2 flex-wrap', className]
                .filter(Boolean)
                .join(' ')}
        >
            {normalizedStatus ? (
                <StatusBadge tone={appointmentStatusTone(normalizedStatus)}>
                    {appointmentStatusLabel(normalizedStatus)}
                </StatusBadge>
            ) : null}
            {shouldShowAccept && onAccept ? (
                <PanelButton
                    type="button"
                    size="sm"
                    variant="primary"
                    disabled={accepting}
                    onClick={onAccept}
                >
                    {acceptLabel}
                </PanelButton>
            ) : null}
            {shouldShowCancel && onCancel ? (
                <PanelButton
                    type="button"
                    size="sm"
                    variant="danger"
                    disabled={cancelling}
                    onClick={onCancel}
                >
                    Anuluj
                </PanelButton>
            ) : null}
            {shouldShowRebook ? (
                <PanelButton
                    href={`/booking?serviceId=${serviceId}`}
                    size="sm"
                    variant="secondary"
                >
                    Umów ponownie
                </PanelButton>
            ) : null}
        </div>
    );
}
