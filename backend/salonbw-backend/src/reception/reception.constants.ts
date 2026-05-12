export const RECEPTION_EVENT_NAMES = ['reception_operational_action'] as const;

export const RECEPTION_ACTIONS = [
    'open_appointment_drawer',
    'confirm_appointment',
    'start_appointment',
    'mark_no_show',
    'finalize_via_drawer',
    'open_customer_profile',
    'open_sale_detail',
] as const;

export const RECEPTION_SOURCES = [
    'reception_view',
    'appointment_drawer',
    'calendar',
] as const;

export const RECEPTION_ALERT_SEVERITIES = [
    'info',
    'warning',
    'danger',
] as const;

export const CRM_FOLLOW_UP_CANDIDATE_REASONS = [
    'recent_no_show',
    'stale_in_progress',
    'high_risk_no_contact',
] as const;

export const CRM_FOLLOW_UP_ACTIONS = [
    'contacted',
    'deferred',
    'dismissed',
    'escalated',
] as const;

export type ReceptionEventName = (typeof RECEPTION_EVENT_NAMES)[number];
export type ReceptionAction = (typeof RECEPTION_ACTIONS)[number];
export type ReceptionSource = (typeof RECEPTION_SOURCES)[number];
export type ReceptionAlertSeverity =
    (typeof RECEPTION_ALERT_SEVERITIES)[number];
export type CrmFollowUpCandidateReason =
    (typeof CRM_FOLLOW_UP_CANDIDATE_REASONS)[number];
export type CrmFollowUpAction = (typeof CRM_FOLLOW_UP_ACTIONS)[number];
