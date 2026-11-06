import { useQueryClient } from '@tanstack/react-query';
import AppointmentDrawer from '@/components/calendar/AppointmentDrawer';
import { useToast } from '@/contexts/ToastContext';
import {
    APPOINTMENTS_QUERY_KEY,
    MY_APPOINTMENTS_QUERY_KEY,
} from '@/hooks/useAppointments';
import { CALENDAR_QUERY_KEY } from '@/hooks/useCalendar';

type Props = {
    customerId: number;
    customerName: string;
    onClose: () => void;
    onSaved?: () => void;
};

/**
 * V18 customer-context entry point for the existing staff booking engine.
 * All availability checks, overlap acknowledgement and appointment writes
 * remain in AppointmentDrawer. The visual variant changes presentation only.
 */
export default function V18CustomerBooking({
    customerId,
    customerName,
    onClose,
    onSaved,
}: Props) {
    const queryClient = useQueryClient();
    const toast = useToast();

    return (
        <AppointmentDrawer
            open
            mode="create"
            visualVariant="v18"
            initialClientId={customerId}
            initialClientName={customerName}
            lockClientSelection
            onClose={onClose}
            onSaved={() => {
                // The drawer posts directly; invalidate all affected readers.
                void queryClient.invalidateQueries({
                    queryKey: CALENDAR_QUERY_KEY,
                });
                void queryClient.invalidateQueries({
                    queryKey: APPOINTMENTS_QUERY_KEY,
                });
                void queryClient.invalidateQueries({
                    queryKey: MY_APPOINTMENTS_QUERY_KEY,
                });
                void queryClient.invalidateQueries({
                    queryKey: ['pending-bookings-count'],
                });
                void queryClient.invalidateQueries({
                    queryKey: ['customer-statistics', customerId],
                });
                void queryClient.invalidateQueries({
                    queryKey: ['customer-events', customerId],
                });
                void queryClient.invalidateQueries({
                    queryKey: ['customers'],
                });
                toast.success('Wizyta została utworzona');
                onSaved?.();
            }}
        />
    );
}
