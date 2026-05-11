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

interface ReceptionOperationalEventPayload {
    eventName: 'reception_operational_action';
    action: ReceptionActionName;
    appointmentId: number;
    source: 'reception_view' | 'appointment_drawer' | 'calendar';
    occurredAt: string;
    customerId?: number;
    customerAlertSeverity?: ReceptionAlertSeverity;
}

type ReceptionTelemetrySender = (
    payload: ReceptionOperationalEventPayload,
) => Promise<unknown>;

let receptionTelemetrySender: ReceptionTelemetrySender | null = null;

export function configureReceptionTelemetryTransport(
    sender: ReceptionTelemetrySender | null,
) {
    receptionTelemetrySender = sender;
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

    if (!source || !receptionTelemetrySender) {
        return;
    }

    const backendPayload: ReceptionOperationalEventPayload = {
        eventName: 'reception_operational_action',
        action,
        appointmentId,
        source,
        occurredAt: new Date().toISOString(),
    };

    if (typeof customerId === 'number' && customerId > 0) {
        backendPayload.customerId = customerId;
    }

    if (customerAlertSeverity) {
        backendPayload.customerAlertSeverity = customerAlertSeverity;
    }

    void receptionTelemetrySender(backendPayload).catch(() => {});
}

export function getAppointmentCustomerId(
    appointment?: Appointment | null,
): number | null {
    return appointment?.client?.id ?? null;
}
