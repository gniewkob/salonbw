import type { Appointment, ReceptionAlertSeverity } from '@/types';
import { trackEvent } from '@/utils/analytics';

export type ReceptionActionName =
    | 'open_appointment_drawer'
    | 'confirm_appointment'
    | 'start_appointment'
    | 'mark_no_show'
    | 'finalize_via_drawer'
    | 'open_customer_profile'
    | 'open_sale_detail';

interface TrackReceptionActionInput {
    action: ReceptionActionName;
    appointmentId: number;
    customerId?: number | null;
    customerAlertSeverity?: ReceptionAlertSeverity | null;
    source?: 'reception_view' | 'appointment_drawer' | 'calendar';
}

export function trackReceptionAction({
    action,
    appointmentId,
    customerId,
    customerAlertSeverity,
    source,
}: TrackReceptionActionInput) {
    const payload: Record<string, unknown> = {
        action,
        appointmentId,
    };

    if (typeof customerId === 'number' && customerId > 0) {
        payload.customerId = customerId;
    }

    if (customerAlertSeverity) {
        payload.customerAlertSeverity = customerAlertSeverity;
    }

    if (source) {
        payload.source = source;
    }

    trackEvent('reception_operational_action', payload);
}

export function getAppointmentCustomerId(
    appointment?: Appointment | null,
): number | null {
    return appointment?.client?.id ?? null;
}
