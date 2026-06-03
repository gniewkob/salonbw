import type { Appointment, CustomerStatistics } from '@/types';

export interface DrawerState {
    open: boolean;
    mode: 'create' | 'edit';
    appointment: Appointment | null;
    initialStartTime?: Date;
    initialEndTime?: Date;
    initialEmployeeId?: number;
    initialServiceId?: number;
    initialClientId?: number;
    initialClientName?: string;
}

export interface CustomerStatisticsBatchItem {
    customerId: number;
    statistics: CustomerStatistics | null;
}

export interface CustomerStatisticsBatchResponse {
    items: CustomerStatisticsBatchItem[];
}

export interface ReceptionOperationalSummaryResponse {
    date: string;
    actionsTotal: number;
    actionsOnAlerts: number;
}

export interface ReceptionOperationalInsightsByActionItem {
    action: string;
    actionsTotal: number;
    actionsOnAlerts: number;
    alertActionRate: number;
}

export interface ReceptionOperationalInsightsByDayItem {
    day: string;
    actionsTotal: number;
    actionsOnAlerts: number;
    alertActionRate: number;
}

export interface ReceptionOperationalInsightsResponse {
    from: string;
    to: string;
    summary: {
        actionsTotal: number;
        actionsOnAlerts: number;
        alertActionRate: number;
    };
    byAction: ReceptionOperationalInsightsByActionItem[];
    byDay: ReceptionOperationalInsightsByDayItem[];
}

export interface ReceptionFollowUpCandidate {
    customerId: number;
    appointmentId: number | null;
    reason: 'recent_no_show' | 'stale_in_progress' | 'high_risk_no_contact';
    priority: 'critical' | 'high' | 'medium';
    suggestedAction: string;
}

export interface ReceptionFollowUpAuditByActionItem {
    action: string;
    count: number;
}

export interface ReceptionFollowUpAuditByReasonItem {
    reason: string;
    count: number;
}

export interface ReceptionFollowUpAuditByDayItem {
    day: string;
    count: number;
}

export interface ReceptionFollowUpAuditResponse {
    from: string;
    to: string;
    actionsTotal: number;
    byAction: ReceptionFollowUpAuditByActionItem[];
    byReason: ReceptionFollowUpAuditByReasonItem[];
    byDay: ReceptionFollowUpAuditByDayItem[];
}

export interface CancellationRequestQueueItem {
    appointmentId: number;
    requestedAt: string;
    reason: string | null;
    client: { id: number; name: string } | null;
    service: { id: number; name: string } | null;
    startTime: string | null;
    status: string | null;
}

export type CancellationRequestActionState = {
    status: 'pending' | 'success' | 'error';
    message?: string;
};

export type ReceptionFollowUpAction =
    | 'contacted'
    | 'deferred'
    | 'dismissed'
    | 'escalated';

export type ReceptionFollowUpActionState = {
    status: 'pending' | 'success' | 'error';
    action: ReceptionFollowUpAction;
    message?: string;
};

export const FOLLOW_UP_REASON_VALUES = [
    'recent_no_show',
    'stale_in_progress',
    'high_risk_no_contact',
] as const;

export const FOLLOW_UP_PRIORITY_VALUES = [
    'critical',
    'high',
    'medium',
] as const;

export const FOLLOW_UP_PRIORITY_SCORE: Record<
    ReceptionFollowUpCandidate['priority'],
    number
> = {
    critical: 3,
    high: 2,
    medium: 1,
};

export type CalendarQueryState = {
    currentDate: Date;
    currentView: import('@/types').CalendarView;
    employeeMode: boolean;
    clientMode: boolean;
    selectedEmployeeIds: number[];
};
