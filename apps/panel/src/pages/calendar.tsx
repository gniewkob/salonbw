import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { ParsedUrlQuery } from 'querystring';
import RouteGuard from '@/components/RouteGuard';
import SalonShell from '@/components/salon/SalonShell';
import SalonBreadcrumbs from '@/components/salon/SalonBreadcrumbs';
import CalendarView from '@/components/calendar/CalendarView';
import AppointmentDrawer from '@/components/calendar/AppointmentDrawer';
import ReceptionView from '@/components/calendar/ReceptionView';
import StaffAppointmentCalendarView from '@/components/calendar/StaffAppointmentCalendarView';
import ClientAppointmentHistoryView from '@/components/calendar/ClientAppointmentHistoryView';
import ReceptionInsightsPanel from '@/components/calendar/ReceptionInsightsPanel';
import ReceptionFollowUpPanel from '@/components/calendar/ReceptionFollowUpPanel';
import ReceptionFollowUpAuditPanel from '@/components/calendar/ReceptionFollowUpAuditPanel';
import {
    hasCustomerAlert,
    isPriorityAppointment,
} from '@/components/calendar/receptionUtils';
import {
    configureReceptionTelemetryTransport,
    trackReceptionAction,
} from '@/components/calendar/receptionTelemetry';
import { useAuth } from '@/contexts/AuthContext';
import type {
    Appointment,
    CalendarEvent,
    CalendarView as CalendarViewType,
    CustomerStatistics,
    ReceptionAlertSeverity,
    ReceptionAlertSeverityByCustomerId,
} from '@/types';
import { useCalendar, useCalendarMutations } from '@/hooks/useCalendar';

interface DrawerState {
    open: boolean;
    mode: 'create' | 'edit';
    appointment: Appointment | null;
    initialStartTime?: Date;
    initialEndTime?: Date;
    initialEmployeeId?: number;
    initialServiceId?: number;
}

interface CustomerStatisticsBatchItem {
    customerId: number;
    statistics: CustomerStatistics | null;
}

interface CustomerStatisticsBatchResponse {
    items: CustomerStatisticsBatchItem[];
}

interface ReceptionOperationalSummaryResponse {
    date: string;
    actionsTotal: number;
    actionsOnAlerts: number;
}

interface ReceptionOperationalInsightsByActionItem {
    action: string;
    actionsTotal: number;
    actionsOnAlerts: number;
    alertActionRate: number;
}

interface ReceptionOperationalInsightsByDayItem {
    day: string;
    actionsTotal: number;
    actionsOnAlerts: number;
    alertActionRate: number;
}

interface ReceptionOperationalInsightsResponse {
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

interface ReceptionFollowUpCandidate {
    customerId: number;
    appointmentId: number | null;
    reason: 'recent_no_show' | 'stale_in_progress' | 'high_risk_no_contact';
    priority: 'critical' | 'high' | 'medium';
    suggestedAction: string;
}

interface ReceptionFollowUpAuditByActionItem {
    action: string;
    count: number;
}

interface ReceptionFollowUpAuditByReasonItem {
    reason: string;
    count: number;
}

interface ReceptionFollowUpAuditByDayItem {
    day: string;
    count: number;
}

interface ReceptionFollowUpAuditResponse {
    from: string;
    to: string;
    actionsTotal: number;
    byAction: ReceptionFollowUpAuditByActionItem[];
    byReason: ReceptionFollowUpAuditByReasonItem[];
    byDay: ReceptionFollowUpAuditByDayItem[];
}

interface CancellationRequestQueueItem {
    appointmentId: number;
    requestedAt: string;
    reason: string | null;
    client: { id: number; name: string } | null;
    service: { id: number; name: string } | null;
    startTime: string | null;
    status: string | null;
}

type CancellationRequestActionState = {
    status: 'pending' | 'success' | 'error';
    message?: string;
};

type ReceptionFollowUpAction =
    | 'contacted'
    | 'deferred'
    | 'dismissed'
    | 'escalated';

type ReceptionFollowUpActionState = {
    status: 'pending' | 'success' | 'error';
    action: ReceptionFollowUpAction;
    message?: string;
};

const FOLLOW_UP_REASON_VALUES = [
    'recent_no_show',
    'stale_in_progress',
    'high_risk_no_contact',
] as const;

const FOLLOW_UP_PRIORITY_VALUES = ['critical', 'high', 'medium'] as const;

const FOLLOW_UP_PRIORITY_SCORE: Record<
    ReceptionFollowUpCandidate['priority'],
    number
> = {
    critical: 3,
    high: 2,
    medium: 1,
};

function toSafeNonNegativeNumber(value: unknown): number {
    if (typeof value !== 'number' || Number.isNaN(value)) {
        return 0;
    }
    return value < 0 ? 0 : value;
}

function normalizeAlertRateFraction(
    value: unknown,
    actionsTotal: number,
    actionsOnAlerts: number,
): number {
    if (actionsTotal > 0) {
        return Math.min(Math.max(actionsOnAlerts / actionsTotal, 0), 1);
    }

    if (typeof value !== 'number' || Number.isNaN(value)) {
        return 0;
    }

    if (value > 1) {
        return Math.min(Math.max(value / 100, 0), 1);
    }

    return Math.min(Math.max(value, 0), 1);
}

function normalizeOperationalInsightsResponse(
    value: unknown,
): ReceptionOperationalInsightsResponse {
    const fallback: ReceptionOperationalInsightsResponse = {
        from: '',
        to: '',
        summary: {
            actionsTotal: 0,
            actionsOnAlerts: 0,
            alertActionRate: 0,
        },
        byAction: [],
        byDay: [],
    };

    if (!value || typeof value !== 'object') {
        return fallback;
    }

    const payload = value as Partial<ReceptionOperationalInsightsResponse>;
    const summaryRaw = payload.summary;
    const summaryActionsTotal = toSafeNonNegativeNumber(
        summaryRaw?.actionsTotal,
    );
    const summaryActionsOnAlerts = Math.min(
        toSafeNonNegativeNumber(summaryRaw?.actionsOnAlerts),
        summaryActionsTotal,
    );

    const byAction = Array.isArray(payload.byAction)
        ? payload.byAction.map((item) => {
              const actionsTotal = toSafeNonNegativeNumber(item?.actionsTotal);
              const actionsOnAlerts = Math.min(
                  toSafeNonNegativeNumber(item?.actionsOnAlerts),
                  actionsTotal,
              );
              return {
                  action: typeof item?.action === 'string' ? item.action : '-',
                  actionsTotal,
                  actionsOnAlerts,
                  alertActionRate: normalizeAlertRateFraction(
                      item?.alertActionRate,
                      actionsTotal,
                      actionsOnAlerts,
                  ),
              };
          })
        : [];

    const byDay = Array.isArray(payload.byDay)
        ? payload.byDay.map((item) => {
              const actionsTotal = toSafeNonNegativeNumber(item?.actionsTotal);
              const actionsOnAlerts = Math.min(
                  toSafeNonNegativeNumber(item?.actionsOnAlerts),
                  actionsTotal,
              );
              return {
                  day: typeof item?.day === 'string' ? item.day : '-',
                  actionsTotal,
                  actionsOnAlerts,
                  alertActionRate: normalizeAlertRateFraction(
                      item?.alertActionRate,
                      actionsTotal,
                      actionsOnAlerts,
                  ),
              };
          })
        : [];

    return {
        from: typeof payload.from === 'string' ? payload.from : '',
        to: typeof payload.to === 'string' ? payload.to : '',
        summary: {
            actionsTotal: summaryActionsTotal,
            actionsOnAlerts: summaryActionsOnAlerts,
            alertActionRate: normalizeAlertRateFraction(
                summaryRaw?.alertActionRate,
                summaryActionsTotal,
                summaryActionsOnAlerts,
            ),
        },
        byAction,
        byDay,
    };
}

function normalizeFollowUpCandidatesResponse(
    value: unknown,
): ReceptionFollowUpCandidate[] {
    if (!Array.isArray(value)) {
        return [];
    }

    const deduped = new Map<string, ReceptionFollowUpCandidate>();

    for (const item of value) {
        if (!item || typeof item !== 'object') continue;
        const row = item as Partial<ReceptionFollowUpCandidate>;

        const customerId = Number(row.customerId);
        if (!Number.isInteger(customerId) || customerId <= 0) {
            continue;
        }

        const reason = FOLLOW_UP_REASON_VALUES.includes(
            row.reason as (typeof FOLLOW_UP_REASON_VALUES)[number],
        )
            ? (row.reason as ReceptionFollowUpCandidate['reason'])
            : 'high_risk_no_contact';

        const priority = FOLLOW_UP_PRIORITY_VALUES.includes(
            row.priority as (typeof FOLLOW_UP_PRIORITY_VALUES)[number],
        )
            ? (row.priority as ReceptionFollowUpCandidate['priority'])
            : 'medium';

        const suggestedAction =
            typeof row.suggestedAction === 'string' &&
            row.suggestedAction.trim().length > 0
                ? row.suggestedAction.trim()
                : 'review_customer_timeline';

        const parsedAppointmentId = Number(row.appointmentId);
        const appointmentId =
            Number.isInteger(parsedAppointmentId) && parsedAppointmentId > 0
                ? parsedAppointmentId
                : null;

        const candidate: ReceptionFollowUpCandidate = {
            customerId,
            appointmentId,
            reason,
            priority,
            suggestedAction,
        };

        const dedupKey = `${customerId}:${reason}`;
        const existing = deduped.get(dedupKey);
        if (!existing) {
            deduped.set(dedupKey, candidate);
            continue;
        }

        const existingScore = FOLLOW_UP_PRIORITY_SCORE[existing.priority];
        const candidateScore = FOLLOW_UP_PRIORITY_SCORE[candidate.priority];
        if (
            candidateScore > existingScore ||
            (candidateScore === existingScore &&
                existing.appointmentId === null &&
                candidate.appointmentId !== null)
        ) {
            deduped.set(dedupKey, candidate);
        }
    }

    return Array.from(deduped.values()).sort((left, right) => {
        const priorityDiff =
            FOLLOW_UP_PRIORITY_SCORE[right.priority] -
            FOLLOW_UP_PRIORITY_SCORE[left.priority];
        if (priorityDiff !== 0) return priorityDiff;

        return left.customerId - right.customerId;
    });
}

function normalizeFollowUpAuditResponse(
    value: unknown,
): ReceptionFollowUpAuditResponse {
    const fallback: ReceptionFollowUpAuditResponse = {
        from: '',
        to: '',
        actionsTotal: 0,
        byAction: [],
        byReason: [],
        byDay: [],
    };

    if (!value || typeof value !== 'object') {
        return fallback;
    }

    const payload = value as Partial<ReceptionFollowUpAuditResponse>;
    const actionsTotal = toSafeNonNegativeNumber(payload.actionsTotal);
    const clampCount = (count: number) =>
        actionsTotal > 0 ? Math.min(count, actionsTotal) : count;

    const byActionMap = new Map<string, number>();
    if (Array.isArray(payload.byAction)) {
        for (const item of payload.byAction) {
            if (!item || typeof item !== 'object') continue;
            const action =
                typeof item.action === 'string' && item.action.trim().length > 0
                    ? item.action.trim()
                    : '-';
            const count = clampCount(toSafeNonNegativeNumber(item.count));
            byActionMap.set(action, (byActionMap.get(action) ?? 0) + count);
        }
    }
    const byAction = Array.from(byActionMap.entries())
        .map(([action, count]) => ({ action, count: clampCount(count) }))
        .sort((left, right) => right.count - left.count);

    const byReasonMap = new Map<string, number>();
    if (Array.isArray(payload.byReason)) {
        for (const item of payload.byReason) {
            if (!item || typeof item !== 'object') continue;
            const reason =
                typeof item.reason === 'string' && item.reason.trim().length > 0
                    ? item.reason.trim()
                    : '-';
            const count = clampCount(toSafeNonNegativeNumber(item.count));
            byReasonMap.set(reason, (byReasonMap.get(reason) ?? 0) + count);
        }
    }
    const byReason = Array.from(byReasonMap.entries())
        .map(([reason, count]) => ({ reason, count: clampCount(count) }))
        .sort((left, right) => right.count - left.count);

    const byDayMap = new Map<string, number>();
    if (Array.isArray(payload.byDay)) {
        for (const item of payload.byDay) {
            if (!item || typeof item !== 'object') continue;
            const day =
                typeof item.day === 'string' && item.day.trim().length > 0
                    ? item.day.trim()
                    : '-';
            const count = clampCount(toSafeNonNegativeNumber(item.count));
            byDayMap.set(day, (byDayMap.get(day) ?? 0) + count);
        }
    }
    const byDay = Array.from(byDayMap.entries())
        .map(([day, count]) => ({ day, count: clampCount(count) }))
        .sort((left, right) => left.day.localeCompare(right.day));

    return {
        from: typeof payload.from === 'string' ? payload.from : '',
        to: typeof payload.to === 'string' ? payload.to : '',
        actionsTotal,
        byAction,
        byReason,
        byDay,
    };
}

function normalizeCancellationRequestsResponse(
    value: unknown,
): CancellationRequestQueueItem[] {
    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .map((item) => {
            if (!item || typeof item !== 'object') return null;
            const row = item as Partial<CancellationRequestQueueItem>;
            const appointmentId = Number(row.appointmentId);
            if (!Number.isInteger(appointmentId) || appointmentId <= 0) {
                return null;
            }
            return {
                appointmentId,
                requestedAt:
                    typeof row.requestedAt === 'string' ? row.requestedAt : '',
                reason:
                    typeof row.reason === 'string' && row.reason.trim().length
                        ? row.reason.trim()
                        : null,
                client:
                    row.client &&
                    typeof row.client.id === 'number' &&
                    typeof row.client.name === 'string'
                        ? { id: row.client.id, name: row.client.name }
                        : null,
                service:
                    row.service &&
                    typeof row.service.id === 'number' &&
                    typeof row.service.name === 'string'
                        ? { id: row.service.id, name: row.service.name }
                        : null,
                startTime:
                    typeof row.startTime === 'string' ? row.startTime : null,
                status: typeof row.status === 'string' ? row.status : null,
            };
        })
        .filter((row): row is CancellationRequestQueueItem => row !== null)
        .sort(
            (left, right) =>
                new Date(right.requestedAt).getTime() -
                new Date(left.requestedAt).getTime(),
        );
}

function toDateParam(value: Date): string {
    const year = value.getFullYear();
    const month = `${value.getMonth() + 1}`.padStart(2, '0');
    const day = `${value.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getFirstQueryValue(
    value: string | string[] | undefined,
): string | undefined {
    return Array.isArray(value) ? value[0] : value;
}

function parseEmployeeIdsParam(value: string | string[] | undefined): number[] {
    const idsParam = getFirstQueryValue(value);
    if (!idsParam) return [];
    return idsParam
        .split(',')
        .map((entry) => Number(entry))
        .filter((entry) => Number.isInteger(entry) && entry > 0);
}

type CalendarQueryState = {
    currentDate: Date;
    currentView: CalendarViewType;
    employeeMode: boolean;
    clientMode: boolean;
    selectedEmployeeIds: number[];
};

function deriveCalendarQueryState(query: ParsedUrlQuery): CalendarQueryState {
    const dateParam = getFirstQueryValue(query.date);
    const parsedDate = dateParam ? new Date(dateParam) : null;
    const currentDate =
        parsedDate && !Number.isNaN(parsedDate.getTime())
            ? parsedDate
            : new Date();

    const viewParam = getFirstQueryValue(query.view);
    if (viewParam === 'client') {
        return {
            currentDate,
            currentView: 'month',
            employeeMode: false,
            clientMode: true,
            selectedEmployeeIds: parseEmployeeIdsParam(query.employeeIds),
        };
    }
    if (viewParam === 'employee' || viewParam === 'staff') {
        return {
            currentDate,
            currentView: 'day',
            employeeMode: true,
            clientMode: false,
            selectedEmployeeIds: parseEmployeeIdsParam(query.employeeIds),
        };
    }
    if (
        viewParam === 'day' ||
        viewParam === 'week' ||
        viewParam === 'month' ||
        viewParam === 'reception'
    ) {
        return {
            currentDate,
            currentView: viewParam,
            employeeMode: false,
            clientMode: false,
            selectedEmployeeIds: parseEmployeeIdsParam(query.employeeIds),
        };
    }

    return {
        currentDate,
        currentView: 'day',
        employeeMode: false,
        clientMode: false,
        selectedEmployeeIds: parseEmployeeIdsParam(query.employeeIds),
    };
}

function areIdsEqual(left: number[], right: number[]): boolean {
    if (left.length !== right.length) return false;
    for (let index = 0; index < left.length; index += 1) {
        if (left[index] !== right[index]) return false;
    }
    return true;
}

function CalendarPageShell() {
    return (
        <div className="salonbw-page" data-testid="calendar-shell">
            <div className="px-3 pt-3 pb-2">
                <div
                    className="placeholder-glow small text-muted mb-2"
                    aria-hidden
                >
                    <span className="placeholder col-2" />
                </div>
                <div
                    className="d-flex align-items-center justify-content-between gap-2"
                    aria-hidden
                >
                    <span className="placeholder col-7" />
                    <span className="placeholder col-2" />
                </div>
            </div>
            <div className="px-3 pb-3">
                <div className="border rounded bg-white p-3">
                    <div className="small text-muted mb-2">
                        Initialising calendar engine...
                    </div>
                    <div className="placeholder-glow d-flex flex-column gap-2">
                        <span className="placeholder col-12" />
                        <span className="placeholder col-12" />
                        <span className="placeholder col-8" />
                    </div>
                </div>
            </div>
        </div>
    );
}

function areAlertMapsEqual(
    left: ReceptionAlertSeverityByCustomerId,
    right: ReceptionAlertSeverityByCustomerId,
): boolean {
    const leftKeys = Object.keys(left);
    const rightKeys = Object.keys(right);
    if (leftKeys.length !== rightKeys.length) return false;
    for (const key of leftKeys) {
        if (left[Number(key)] !== right[Number(key)]) return false;
    }
    return true;
}

export default function CalendarPage() {
    const router = useRouter();
    const isRouterReady = router.isReady ?? true;
    const initialQueryState = deriveCalendarQueryState(router.query);
    const { role, user, apiFetch } = useAuth();
    const isMountedRef = useRef(true);
    const visibleCustomerIdsRef = useRef<number[]>([]);
    const handledDeepLinkAppointmentIdRef = useRef<number | null>(null);
    const customerAlertCacheRef = useRef<
        Record<number, Exclude<ReceptionAlertSeverity, 'info'> | null>
    >({});
    const pendingCustomerAlertFetchesRef = useRef<Set<number>>(new Set());
    const [currentDate, setCurrentDate] = useState(
        initialQueryState.currentDate,
    );
    const [currentView, setCurrentView] = useState<CalendarViewType>(
        initialQueryState.currentView,
    );
    const [employeeMode, setEmployeeMode] = useState(
        initialQueryState.employeeMode,
    );
    const [clientMode, setClientMode] = useState(initialQueryState.clientMode);
    const [queryStateReady, setQueryStateReady] = useState(isRouterReady);
    const [employeeArchiveMode, setEmployeeArchiveMode] = useState(false);
    const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<number[]>(
        initialQueryState.selectedEmployeeIds,
    );
    const [customerAlertSeverityById, setCustomerAlertSeverityById] =
        useState<ReceptionAlertSeverityByCustomerId>({});
    const [receptionStatusFilter, setReceptionStatusFilter] = useState('all');
    const [receptionPaymentFilter, setReceptionPaymentFilter] = useState('all');
    const [receptionAlertFilter, setReceptionAlertFilter] = useState(false);
    const [receptionPriorityFilter, setReceptionPriorityFilter] =
        useState(false);
    const [receptionNowTick, setReceptionNowTick] = useState(() => Date.now());
    const [deepLinkError, setDeepLinkError] = useState<string | null>(null);
    const [customerAlertStatsError, setCustomerAlertStatsError] =
        useState(false);
    const [customerAlertStatsRetryToken, setCustomerAlertStatsRetryToken] =
        useState(0);
    const [receptionActionsOnAlertsCount, setReceptionActionsOnAlertsCount] =
        useState(0);
    const [persistedActionsOnAlertsCount, setPersistedActionsOnAlertsCount] =
        useState<number | null>(null);
    const [persistedActionsTotalCount, setPersistedActionsTotalCount] =
        useState<number | null>(null);
    const [receptionInsightsLoading, setReceptionInsightsLoading] =
        useState(false);
    const [receptionInsightsError, setReceptionInsightsError] = useState(false);
    const [receptionInsightsSummary, setReceptionInsightsSummary] = useState<{
        actionsTotal: number;
        actionsOnAlerts: number;
        alertActionRate: number;
    } | null>(null);
    const [receptionInsightsByAction, setReceptionInsightsByAction] = useState<
        ReceptionOperationalInsightsByActionItem[]
    >([]);
    const [receptionInsightsByDay, setReceptionInsightsByDay] = useState<
        ReceptionOperationalInsightsByDayItem[]
    >([]);
    const [receptionFollowUpLoading, setReceptionFollowUpLoading] =
        useState(false);
    const [receptionFollowUpError, setReceptionFollowUpError] = useState(false);
    const [receptionFollowUpCandidates, setReceptionFollowUpCandidates] =
        useState<ReceptionFollowUpCandidate[]>([]);
    const [
        receptionFollowUpActionStateByKey,
        setReceptionFollowUpActionStateByKey,
    ] = useState<Record<string, ReceptionFollowUpActionState>>({});
    const [followUpAuditLoading, setFollowUpAuditLoading] = useState(false);
    const [followUpAuditError, setFollowUpAuditError] = useState(false);
    const [followUpAuditSummary, setFollowUpAuditSummary] =
        useState<ReceptionFollowUpAuditResponse | null>(null);
    const [cancellationRequestsLoading, setCancellationRequestsLoading] =
        useState(false);
    const [cancellationRequestsError, setCancellationRequestsError] =
        useState(false);
    const [cancellationRequests, setCancellationRequests] = useState<
        CancellationRequestQueueItem[]
    >([]);
    const [
        cancellationRequestActionStateByAppointmentId,
        setCancellationRequestActionStateByAppointmentId,
    ] = useState<Record<number, CancellationRequestActionState>>({});
    const [drawer, setDrawer] = useState<DrawerState>({
        open: false,
        mode: 'create',
        appointment: null,
    });

    useEffect(
        () => () => {
            isMountedRef.current = false;
        },
        [],
    );

    const { data, loading, refetch } = useCalendar({
        date: toDateParam(currentDate),
        view: currentView,
        employeeIds:
            selectedEmployeeIds.length > 0 ? selectedEmployeeIds : undefined,
        enabled: queryStateReady,
    });
    const { rescheduleAppointment, checkConflicts } = useCalendarMutations();

    useEffect(() => {
        configureReceptionTelemetryTransport((payload) =>
            apiFetch('/reception/operational-events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            }),
        );

        return () => {
            configureReceptionTelemetryTransport(null);
        };
    }, [apiFetch]);

    const appointmentsById = useMemo(() => {
        const map = new Map<number, Appointment>();
        for (const event of data?.events ?? []) {
            if (event.type !== 'appointment') continue;
            map.set(event.id, {
                id: event.id,
                startTime: event.startTime,
                endTime: event.endTime,
                status: event.status as Appointment['status'],
                client: event.clientId
                    ? { id: event.clientId, name: event.clientName ?? '-' }
                    : undefined,
                service: event.serviceId
                    ? {
                          id: event.serviceId,
                          name: event.serviceName ?? '-',
                          duration: 0,
                          price: 0,
                          priceType: 'fixed',
                          isActive: true,
                          onlineBooking: false,
                          sortOrder: 0,
                      }
                    : undefined,
                employee:
                    event.employeeId > 0
                        ? {
                              id: event.employeeId,
                              name: event.employeeName,
                          }
                        : undefined,
            });
        }
        return map;
    }, [data?.events]);

    const handleEventClick = (event: CalendarEvent) => {
        if (event.type !== 'appointment') return;
        const appointment = appointmentsById.get(event.id);
        trackReceptionAction({
            action: 'open_appointment_drawer',
            appointmentId: event.id,
            customerId: event.clientId ?? appointment?.client?.id ?? null,
            customerAlertSeverity:
                event.customerAlertSeverity ??
                (event.clientId
                    ? customerAlertSeverityById[event.clientId]
                    : undefined),
            source: 'calendar',
        });

        setDrawer({
            open: true,
            mode: 'edit',
            appointment: appointment ?? null,
        });
    };

    const receptionAppointments = useMemo(() => {
        const list = Array.from(appointmentsById.values());
        const now = new Date(receptionNowTick);

        return list.filter((appointment) => {
            const status = appointment.status ?? 'scheduled';
            const paymentStatus = appointment.paymentStatus ?? 'unpaid';
            const hasAlert = hasCustomerAlert(
                appointment,
                customerAlertSeverityById,
            );
            const isPriority = isPriorityAppointment(
                appointment,
                now,
                customerAlertSeverityById,
            );

            if (
                receptionStatusFilter !== 'all' &&
                status !== receptionStatusFilter
            ) {
                return false;
            }

            if (
                receptionPaymentFilter === 'unpaid' &&
                paymentStatus === 'paid'
            ) {
                return false;
            }

            if (
                receptionPaymentFilter === 'to_finalize' &&
                status !== 'in_progress'
            ) {
                return false;
            }

            if (receptionAlertFilter && !hasAlert) {
                return false;
            }

            if (receptionPriorityFilter && !isPriority) {
                return false;
            }

            return true;
        });
    }, [
        appointmentsById,
        customerAlertSeverityById,
        receptionStatusFilter,
        receptionPaymentFilter,
        receptionAlertFilter,
        receptionPriorityFilter,
        receptionNowTick,
    ]);

    const employeeAppointments = useMemo(() => {
        const list = Array.from(appointmentsById.values());
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const archiveStatuses = new Set(['completed', 'cancelled', 'no_show']);

        return list.filter((appointment) => {
            if (role === 'employee' && user?.id && appointment.employee?.id) {
                if (appointment.employee.id !== user.id) {
                    return false;
                }
            }

            const start = new Date(appointment.startTime);
            const status = appointment.status ?? 'scheduled';
            const isArchived =
                archiveStatuses.has(status) ||
                start.getTime() < todayStart.getTime();

            return employeeArchiveMode ? isArchived : !isArchived;
        });
    }, [appointmentsById, employeeArchiveMode, role, user?.id]);

    const clientAppointments = useMemo(() => {
        const list = Array.from(appointmentsById.values());
        if (role !== 'client' || !user?.id) {
            return [];
        }
        return list.filter((appointment) => appointment.client?.id === user.id);
    }, [appointmentsById, role, user?.id]);

    const clientFutureAppointments = useMemo(() => {
        const now = Date.now();
        const archiveStatuses = new Set(['completed', 'cancelled', 'no_show']);
        return clientAppointments
            .filter((appointment) => {
                const status = appointment.status ?? 'scheduled';
                const startTs = new Date(appointment.startTime).getTime();
                return !archiveStatuses.has(status) && startTs >= now;
            })
            .sort(
                (left, right) =>
                    new Date(left.startTime).getTime() -
                    new Date(right.startTime).getTime(),
            );
    }, [clientAppointments]);

    const clientArchivedAppointments = useMemo(() => {
        const now = Date.now();
        const archiveStatuses = new Set(['completed', 'cancelled', 'no_show']);
        return clientAppointments
            .filter((appointment) => {
                const status = appointment.status ?? 'scheduled';
                const startTs = new Date(appointment.startTime).getTime();
                return archiveStatuses.has(status) || startTs < now;
            })
            .sort(
                (left, right) =>
                    new Date(right.startTime).getTime() -
                    new Date(left.startTime).getTime(),
            );
    }, [clientAppointments]);

    const receptionDailySummary = useMemo(() => {
        const allAppointments = Array.from(appointmentsById.values());
        const toFinalize = allAppointments.filter(
            (appointment) => appointment.status === 'in_progress',
        ).length;
        const noShow = allAppointments.filter(
            (appointment) => appointment.status === 'no_show',
        ).length;
        const withAlert = allAppointments.filter((appointment) =>
            hasCustomerAlert(appointment, customerAlertSeverityById),
        ).length;

        return {
            toFinalize,
            noShow,
            withAlert,
            actionsTotal: persistedActionsTotalCount ?? 0,
            actionsOnAlerts:
                (persistedActionsOnAlertsCount ?? 0) +
                receptionActionsOnAlertsCount,
        };
    }, [
        appointmentsById,
        customerAlertSeverityById,
        persistedActionsOnAlertsCount,
        persistedActionsTotalCount,
        receptionActionsOnAlertsCount,
    ]);

    useEffect(() => {
        if (currentView !== 'reception') return;

        const timerId = window.setInterval(() => {
            setReceptionNowTick(Date.now());
        }, 60_000);

        return () => {
            window.clearInterval(timerId);
        };
    }, [currentView]);

    useEffect(() => {
        setReceptionActionsOnAlertsCount(0);
    }, [currentDate, currentView, selectedEmployeeIds]);

    useEffect(() => {
        if (currentView !== 'reception') {
            setPersistedActionsOnAlertsCount(null);
            setPersistedActionsTotalCount(null);
            return;
        }

        const date = toDateParam(currentDate);
        let cancelled = false;

        void apiFetch<ReceptionOperationalSummaryResponse>(
            `/reception/operational-summary?date=${encodeURIComponent(date)}`,
        )
            .then((summary) => {
                if (cancelled) return;
                setPersistedActionsTotalCount(summary.actionsTotal ?? 0);
                setPersistedActionsOnAlertsCount(summary.actionsOnAlerts ?? 0);
            })
            .catch(() => {
                if (cancelled) return;
                setPersistedActionsTotalCount(null);
                setPersistedActionsOnAlertsCount(null);
            });

        return () => {
            cancelled = true;
        };
    }, [apiFetch, currentDate, currentView]);

    useEffect(() => {
        if (currentView !== 'reception') {
            setReceptionFollowUpLoading(false);
            setReceptionFollowUpError(false);
            setReceptionFollowUpCandidates([]);
            setReceptionFollowUpActionStateByKey({});
            return;
        }

        const date = toDateParam(currentDate);
        let cancelled = false;

        setReceptionFollowUpLoading(true);
        setReceptionFollowUpError(false);

        void apiFetch<ReceptionFollowUpCandidate[]>(
            `/crm/follow-up-candidates?date=${encodeURIComponent(date)}`,
        )
            .then((candidates) => {
                if (cancelled) return;
                const normalized =
                    normalizeFollowUpCandidatesResponse(candidates);
                setReceptionFollowUpCandidates(normalized);
                setReceptionFollowUpError(false);
            })
            .catch(() => {
                if (cancelled) return;
                setReceptionFollowUpCandidates([]);
                setReceptionFollowUpError(true);
            })
            .finally(() => {
                if (cancelled) return;
                setReceptionFollowUpLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [apiFetch, currentDate, currentView]);

    useEffect(() => {
        if (currentView !== 'reception') {
            setFollowUpAuditLoading(false);
            setFollowUpAuditError(false);
            setFollowUpAuditSummary(null);
            return;
        }

        const rangeEnd = toDateParam(currentDate);
        const rangeStartDate = new Date(currentDate);
        rangeStartDate.setDate(rangeStartDate.getDate() - 6);
        const rangeStart = toDateParam(rangeStartDate);
        let cancelled = false;

        setFollowUpAuditLoading(true);
        setFollowUpAuditError(false);

        void apiFetch<ReceptionFollowUpAuditResponse>(
            `/crm/follow-up-actions?from=${encodeURIComponent(rangeStart)}&to=${encodeURIComponent(rangeEnd)}`,
        )
            .then((summary) => {
                if (cancelled) return;
                setFollowUpAuditSummary(
                    normalizeFollowUpAuditResponse(summary),
                );
                setFollowUpAuditError(false);
            })
            .catch(() => {
                if (cancelled) return;
                setFollowUpAuditSummary(null);
                setFollowUpAuditError(true);
            })
            .finally(() => {
                if (cancelled) return;
                setFollowUpAuditLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [apiFetch, currentDate, currentView]);

    const handleCaptureFollowUpAction = (
        candidate: ReceptionFollowUpCandidate,
        action: ReceptionFollowUpAction,
    ) => {
        if (candidate.appointmentId === null) {
            return;
        }

        const candidateKey = `${candidate.customerId}:${candidate.reason}`;
        setReceptionFollowUpActionStateByKey((current) => ({
            ...current,
            [candidateKey]: { status: 'pending', action },
        }));

        void apiFetch('/crm/follow-up-actions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                customerId: candidate.customerId,
                appointmentId: candidate.appointmentId,
                candidateReason: candidate.reason,
                action,
                occurredAt: new Date().toISOString(),
            }),
        })
            .then(() => {
                setReceptionFollowUpActionStateByKey((current) => ({
                    ...current,
                    [candidateKey]: { status: 'success', action },
                }));
            })
            .catch(() => {
                setReceptionFollowUpActionStateByKey((current) => ({
                    ...current,
                    [candidateKey]: {
                        status: 'error',
                        action,
                        message: 'Nie udało się zapisać akcji follow-up.',
                    },
                }));
            });
    };

    useEffect(() => {
        if (currentView !== 'reception') {
            setCancellationRequestsLoading(false);
            setCancellationRequestsError(false);
            setCancellationRequests([]);
            setCancellationRequestActionStateByAppointmentId({});
            return;
        }

        let cancelled = false;
        setCancellationRequestsLoading(true);
        setCancellationRequestsError(false);

        void apiFetch<CancellationRequestQueueItem[]>(
            '/appointments/cancellation-requests?limit=50',
        )
            .then((response) => {
                if (cancelled) return;
                setCancellationRequests(
                    normalizeCancellationRequestsResponse(response),
                );
                setCancellationRequestsError(false);
            })
            .catch(() => {
                if (cancelled) return;
                setCancellationRequests([]);
                setCancellationRequestsError(true);
            })
            .finally(() => {
                if (cancelled) return;
                setCancellationRequestsLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [apiFetch, currentView]);

    const handleCancelFromRequestQueue = (appointmentId: number) => {
        setCancellationRequestActionStateByAppointmentId((current) => ({
            ...current,
            [appointmentId]: { status: 'pending' },
        }));

        void apiFetch(`/appointments/${appointmentId}/cancel`, {
            method: 'PATCH',
        })
            .then(() => {
                setCancellationRequests((current) =>
                    current.filter(
                        (request) => request.appointmentId !== appointmentId,
                    ),
                );
                setCancellationRequestActionStateByAppointmentId((current) => ({
                    ...current,
                    [appointmentId]: {
                        status: 'success',
                        message: 'Wizyta została anulowana.',
                    },
                }));
                void refetch();
            })
            .catch(() => {
                setCancellationRequestActionStateByAppointmentId((current) => ({
                    ...current,
                    [appointmentId]: {
                        status: 'error',
                        message:
                            'Nie udało się anulować wizyty. Spróbuj ponownie.',
                    },
                }));
            });
    };

    useEffect(() => {
        if (currentView !== 'reception') {
            setReceptionInsightsLoading(false);
            setReceptionInsightsError(false);
            setReceptionInsightsSummary(null);
            setReceptionInsightsByAction([]);
            setReceptionInsightsByDay([]);
            return;
        }

        const rangeEnd = toDateParam(currentDate);
        const rangeStartDate = new Date(currentDate);
        rangeStartDate.setDate(rangeStartDate.getDate() - 6);
        const rangeStart = toDateParam(rangeStartDate);
        let cancelled = false;

        setReceptionInsightsLoading(true);
        setReceptionInsightsError(false);

        void apiFetch<ReceptionOperationalInsightsResponse>(
            `/reception/operational-insights?from=${encodeURIComponent(rangeStart)}&to=${encodeURIComponent(rangeEnd)}`,
        )
            .then((insights) => {
                if (cancelled) return;
                const normalized =
                    normalizeOperationalInsightsResponse(insights);
                setReceptionInsightsSummary(normalized.summary);
                setReceptionInsightsByAction(normalized.byAction);
                setReceptionInsightsByDay(normalized.byDay);
                setReceptionInsightsError(false);
            })
            .catch(() => {
                if (cancelled) return;
                setReceptionInsightsSummary(null);
                setReceptionInsightsByAction([]);
                setReceptionInsightsByDay([]);
                setReceptionInsightsError(true);
            })
            .finally(() => {
                if (cancelled) return;
                setReceptionInsightsLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [apiFetch, currentDate, currentView]);

    useEffect(() => {
        if (!isRouterReady) return;
        const next = deriveCalendarQueryState(router.query);
        setCurrentDate((current) =>
            toDateParam(current) === toDateParam(next.currentDate)
                ? current
                : next.currentDate,
        );
        setCurrentView((current) =>
            current === next.currentView ? current : next.currentView,
        );
        setEmployeeMode((current) =>
            current === next.employeeMode ? current : next.employeeMode,
        );
        setClientMode((current) =>
            current === next.clientMode ? current : next.clientMode,
        );
        setSelectedEmployeeIds((current) =>
            areIdsEqual(current, next.selectedEmployeeIds)
                ? current
                : next.selectedEmployeeIds,
        );
        setQueryStateReady(true);
    }, [
        isRouterReady,
        router.query,
        router.query.date,
        router.query.employeeIds,
        router.query.view,
    ]);

    useEffect(() => {
        const appointmentIdParam = Array.isArray(router.query.appointmentId)
            ? router.query.appointmentId[0]
            : router.query.appointmentId;
        if (!appointmentIdParam) {
            handledDeepLinkAppointmentIdRef.current = null;
            setDeepLinkError(null);
            return;
        }

        const appointmentId = Number(appointmentIdParam);
        if (!Number.isFinite(appointmentId) || appointmentId <= 0) return;
        if (handledDeepLinkAppointmentIdRef.current === appointmentId) return;

        const appointmentFromCalendar = appointmentsById.get(appointmentId);
        if (appointmentFromCalendar) {
            setDeepLinkError(null);
            setDrawer({
                open: true,
                mode: 'edit',
                appointment: appointmentFromCalendar,
            });
            handledDeepLinkAppointmentIdRef.current = appointmentId;
            return;
        }

        let cancelled = false;

        void apiFetch<Appointment>(`/appointments/${appointmentId}`)
            .then((appointment) => {
                if (cancelled) return;
                setDeepLinkError(null);
                setDrawer({
                    open: true,
                    mode: 'edit',
                    appointment,
                });
                handledDeepLinkAppointmentIdRef.current = appointmentId;
            })
            .catch(() => {
                if (cancelled) return;
                console.warn('[calendar] deep-link fetch failed', {
                    appointmentId,
                });
                setDeepLinkError(
                    'Nie udało się otworzyć wizyty z linku. Spróbuj ponownie.',
                );
            });

        return () => {
            cancelled = true;
        };
    }, [router.query.appointmentId, appointmentsById, apiFetch]);

    useEffect(() => {
        if (!isRouterReady) return;
        const param = Array.isArray(router.query.newService)
            ? router.query.newService[0]
            : router.query.newService;
        if (!param) return;
        const serviceId = Number(param);
        if (!Number.isFinite(serviceId) || serviceId <= 0) return;
        setDrawer({
            open: true,
            mode: 'create',
            appointment: null,
            initialServiceId: serviceId,
        });
        const rest = Object.fromEntries(
            Object.entries(router.query).filter(([k]) => k !== 'newService'),
        );
        void router.replace({ query: rest }, undefined, { shallow: true });
    }, [router.query.newService, isRouterReady, router]);

    const visibleCustomerIds = useMemo(
        () =>
            Array.from(
                new Set(
                    (data?.events ?? [])
                        .filter(
                            (event) =>
                                event.type === 'appointment' &&
                                Number(event.clientId) > 0,
                        )
                        .map((event) => Number(event.clientId)),
                ),
            ),
        [data?.events],
    );

    useEffect(() => {
        visibleCustomerIdsRef.current = visibleCustomerIds;
    }, [visibleCustomerIds]);

    const shouldFetchCustomerAlertStats =
        currentView === 'reception' && !clientMode;

    useEffect(() => {
        if (!shouldFetchCustomerAlertStats) {
            setCustomerAlertStatsError(false);
            setCustomerAlertSeverityById((current) =>
                Object.keys(current).length === 0 ? current : {},
            );
            return;
        }
        if (visibleCustomerIds.length === 0) {
            setCustomerAlertStatsError(false);
            setCustomerAlertSeverityById((current) =>
                Object.keys(current).length === 0 ? current : {},
            );
            return;
        }

        const currentFromCache: ReceptionAlertSeverityByCustomerId = {};
        const missingCustomerIds: number[] = [];

        for (const customerId of visibleCustomerIds) {
            if (customerId in customerAlertCacheRef.current) {
                const cached = customerAlertCacheRef.current[customerId];
                if (cached) currentFromCache[customerId] = cached;
            } else {
                if (!pendingCustomerAlertFetchesRef.current.has(customerId)) {
                    missingCustomerIds.push(customerId);
                }
            }
        }

        setCustomerAlertSeverityById((current) =>
            areAlertMapsEqual(current, currentFromCache)
                ? current
                : currentFromCache,
        );
        if (missingCustomerIds.length === 0) {
            setCustomerAlertStatsError(false);
            return;
        }

        for (const customerId of missingCustomerIds) {
            pendingCustomerAlertFetchesRef.current.add(customerId);
        }

        // If the batch endpoint fails we fall back to per-customer GETs
        // (one round-trip per missing customer). That's the original
        // behaviour, but it turns one bad batch into N requests every
        // re-render — for a daily reception view that's 30–50 calls each
        // tick. Cap the fallback at a small N so the cost of a persistent
        // batch failure stays bounded; above the cap, surface the failure
        // via `customerAlertStatsError` and let the user hit the retry
        // button (which bumps `customerAlertStatsRetryToken`) once the
        // backend is healthy.
        const FALLBACK_MAX_CUSTOMERS = 5;

        const fetchPerCustomerFallback = async () =>
            Promise.all(
                missingCustomerIds.map(async (customerId) => {
                    try {
                        const stats = await apiFetch<CustomerStatistics>(
                            `/customers/${customerId}/statistics`,
                        );
                        const severity =
                            stats.noShowVisits >= 2
                                ? ('danger' as const)
                                : stats.noShowVisits > 0
                                  ? ('warning' as const)
                                  : null;
                        return { customerId, severity, success: true as const };
                    } catch {
                        return {
                            customerId,
                            severity: null,
                            success: false as const,
                        };
                    }
                }),
            );

        const fetchMissingCustomerStats = async () => {
            try {
                const params = new URLSearchParams();
                params.set('ids', missingCustomerIds.join(','));
                params.set('scope', 'alerts');
                const query = params.toString();
                const response =
                    await apiFetch<CustomerStatisticsBatchResponse>(
                        `/customers/statistics/batch${query ? `?${query}` : ''}`,
                    );

                if (!response || !Array.isArray(response.items)) {
                    throw new Error('Invalid batch response');
                }

                const itemsByCustomerId = new Map<
                    number,
                    CustomerStatistics | null
                >();
                for (const item of response.items) {
                    if (
                        item &&
                        Number.isInteger(item.customerId) &&
                        item.customerId > 0
                    ) {
                        itemsByCustomerId.set(item.customerId, item.statistics);
                    }
                }

                return missingCustomerIds.map((customerId) => {
                    const stats = itemsByCustomerId.get(customerId);
                    if (!stats) {
                        return {
                            customerId,
                            severity: null,
                            success: false as const,
                        };
                    }

                    const severity =
                        stats.noShowVisits >= 2
                            ? ('danger' as const)
                            : stats.noShowVisits > 0
                              ? ('warning' as const)
                              : null;

                    return { customerId, severity, success: true as const };
                });
            } catch {
                if (missingCustomerIds.length > FALLBACK_MAX_CUSTOMERS) {
                    // Too many missing customers — skip the fan-out and
                    // mark them all failed so the UI shows the retry
                    // banner instead of hammering the backend.
                    return missingCustomerIds.map((customerId) => ({
                        customerId,
                        severity: null,
                        success: false as const,
                    }));
                }
                return await fetchPerCustomerFallback();
            } finally {
                for (const customerId of missingCustomerIds) {
                    pendingCustomerAlertFetchesRef.current.delete(customerId);
                }
            }
        };

        void fetchMissingCustomerStats().then((entries) => {
            let hasFailures = false;
            const failedCustomerIds: number[] = [];
            for (const entry of entries) {
                if (entry.success) {
                    customerAlertCacheRef.current[entry.customerId] =
                        entry.severity;
                } else {
                    hasFailures = true;
                    failedCustomerIds.push(entry.customerId);
                }
            }

            if (hasFailures) {
                console.warn('[calendar] customer alert stats fetch failed', {
                    failedCustomerIds,
                    failedCount: failedCustomerIds.length,
                });
            }

            const nextVisible: ReceptionAlertSeverityByCustomerId = {};
            for (const customerId of visibleCustomerIdsRef.current) {
                const cached = customerAlertCacheRef.current[customerId];
                if (cached) nextVisible[customerId] = cached;
            }
            if (!isMountedRef.current) return;
            setCustomerAlertStatsError(hasFailures);
            setCustomerAlertSeverityById((current) =>
                areAlertMapsEqual(current, nextVisible) ? current : nextVisible,
            );
        });
    }, [
        shouldFetchCustomerAlertStats,
        visibleCustomerIds,
        apiFetch,
        customerAlertStatsRetryToken,
    ]);

    const updateCalendarQuery = (
        next: Partial<{
            date: string;
            view: CalendarViewType | 'employee' | 'staff' | 'client';
            employeeIds: number[];
        }>,
    ) => {
        const query = { ...router.query } as Record<string, string>;
        if (next.date !== undefined) query.date = next.date;
        if (next.view !== undefined) query.view = next.view;
        if (next.employeeIds !== undefined) {
            if (next.employeeIds.length > 0) {
                query.employeeIds = next.employeeIds.join(',');
            } else {
                delete query.employeeIds;
            }
        }
        void router.push({ pathname: router.pathname, query }, undefined, {
            shallow: true,
        });
    };

    const openAppointmentDeepLink = (appointmentId: number) => {
        const query = { ...router.query } as Record<string, string>;
        query.appointmentId = String(appointmentId);
        void router.push({ pathname: router.pathname, query }, undefined, {
            shallow: true,
        });
    };

    const clearAppointmentDeepLink = () => {
        const query = { ...router.query } as Record<string, string>;
        delete query.appointmentId;
        void router.push({ pathname: router.pathname, query }, undefined, {
            shallow: true,
        });
    };

    const retryCustomerAlertStats = () => {
        const nextCache = { ...customerAlertCacheRef.current };
        for (const customerId of visibleCustomerIdsRef.current) {
            delete nextCache[customerId];
        }
        customerAlertCacheRef.current = nextCache;
        pendingCustomerAlertFetchesRef.current.clear();
        setCustomerAlertStatsError(false);
        setCustomerAlertSeverityById((current) =>
            Object.keys(current).length === 0 ? current : {},
        );
        setCustomerAlertStatsRetryToken((current) => current + 1);
    };

    const handleEventDrop = async (
        eventId: number,
        newStart: Date,
        newEnd: Date,
        newEmployeeId?: number,
        revert?: () => void,
    ) => {
        const event = (data?.events ?? []).find(
            (entry) => entry.id === eventId && entry.type === 'appointment',
        );
        if (!event) return;

        const targetEmployeeId = newEmployeeId ?? event.employeeId;
        const conflictCheck = await checkConflicts(
            targetEmployeeId,
            newStart.toISOString(),
            newEnd.toISOString(),
            eventId,
        );

        if (conflictCheck.hasConflict) {
            revert?.();
            await refetch();
            return;
        }

        await rescheduleAppointment.mutateAsync({
            id: eventId,
            startTime: newStart.toISOString(),
            endTime: newEnd.toISOString(),
            employeeId: targetEmployeeId,
        });
    };

    if (!role) return null;

    return (
        <RouteGuard
            permission="nav:calendar"
            loadingFallback={<CalendarPageShell />}
        >
            <SalonShell role={role}>
                <div className="salonbw-page" data-testid="calendar-page">
                    <SalonBreadcrumbs
                        iconClass="sprite-breadcrumbs_calendar"
                        items={[{ label: 'Kalendarz' }]}
                    />

                    <div className="d-flex align-items-center justify-content-between gap-2 px-3 pb-2">
                        <div className="small text-muted">
                            Natywny kalendarz Booksy-like (beta). Legacy:{' '}
                            <Link href="/calendar">/calendar</Link>
                        </div>
                        {role !== 'client' ? (
                            <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                onClick={() =>
                                    setDrawer({
                                        open: true,
                                        mode: 'create',
                                        appointment: null,
                                        initialStartTime: new Date(),
                                    })
                                }
                            >
                                Nowa wizyta
                            </button>
                        ) : null}
                    </div>

                    <div className="px-3 pb-3">
                        {deepLinkError ? (
                            <div className="alert alert-warning py-2 mb-2">
                                {deepLinkError}
                            </div>
                        ) : null}
                        {currentView === 'reception' && !employeeMode ? (
                            <div className="d-flex flex-column gap-3">
                                {customerAlertStatsError ? (
                                    <div className="alert alert-warning py-2 mb-0">
                                        <div>
                                            Część alertów CRM jest chwilowo
                                            niedostępna. Spróbujemy ponownie
                                            przy kolejnym odświeżeniu widoku.
                                        </div>
                                        <button
                                            type="button"
                                            className="btn btn-outline-warning btn-sm mt-2"
                                            onClick={retryCustomerAlertStats}
                                        >
                                            Ponów teraz
                                        </button>
                                    </div>
                                ) : null}
                                <div
                                    className="row row-cols-2 row-cols-lg-4 g-2 mb-2"
                                    data-testid="reception-daily-summary"
                                >
                                    <div className="col">
                                        <div className="border rounded p-2 h-100">
                                            <div className="small text-muted">
                                                Do finalizacji
                                            </div>
                                            <div className="fw-semibold">
                                                {
                                                    receptionDailySummary.toFinalize
                                                }
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col">
                                        <div className="border rounded p-2 h-100">
                                            <div className="small text-muted">
                                                No-show
                                            </div>
                                            <div className="fw-semibold">
                                                {receptionDailySummary.noShow}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col">
                                        <div className="border rounded p-2 h-100">
                                            <div className="small text-muted">
                                                Z alertem CRM
                                            </div>
                                            <div className="fw-semibold">
                                                {
                                                    receptionDailySummary.withAlert
                                                }
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col">
                                        <div className="border rounded p-2 h-100">
                                            <div className="small text-muted">
                                                Akcje na alertach
                                            </div>
                                            <div className="fw-semibold">
                                                {
                                                    receptionDailySummary.actionsOnAlerts
                                                }
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <ReceptionInsightsPanel
                                    loading={receptionInsightsLoading}
                                    error={receptionInsightsError}
                                    actionsTotal={
                                        receptionInsightsSummary?.actionsTotal ??
                                        null
                                    }
                                    actionsOnAlerts={
                                        receptionInsightsSummary?.actionsOnAlerts ??
                                        null
                                    }
                                    alertActionRate={
                                        receptionInsightsSummary?.alertActionRate ??
                                        null
                                    }
                                    byAction={receptionInsightsByAction}
                                    byDay={receptionInsightsByDay}
                                    onEnablePriorityFilter={() => {
                                        setReceptionPriorityFilter(true);
                                    }}
                                    onEnableAlertFilter={() => {
                                        setReceptionAlertFilter(true);
                                    }}
                                    onShowToFinalize={() => {
                                        setReceptionStatusFilter('in_progress');
                                        setReceptionPaymentFilter(
                                            'to_finalize',
                                        );
                                    }}
                                    isPriorityFilterActive={
                                        receptionPriorityFilter
                                    }
                                    isAlertFilterActive={receptionAlertFilter}
                                    isToFinalizeFilterActive={
                                        receptionStatusFilter ===
                                            'in_progress' &&
                                        receptionPaymentFilter === 'to_finalize'
                                    }
                                />
                                <ReceptionFollowUpPanel
                                    loading={receptionFollowUpLoading}
                                    error={receptionFollowUpError}
                                    candidates={receptionFollowUpCandidates}
                                    actionStateByCandidateKey={
                                        receptionFollowUpActionStateByKey
                                    }
                                    onOpenAppointment={(id) => {
                                        openAppointmentDeepLink(id);
                                    }}
                                    onOpenCustomer={(id) => {
                                        void router.push(`/customers/${id}`);
                                    }}
                                    onCaptureFollowUpAction={
                                        handleCaptureFollowUpAction
                                    }
                                />
                                <ReceptionFollowUpAuditPanel
                                    loading={followUpAuditLoading}
                                    error={followUpAuditError}
                                    actionsTotal={
                                        followUpAuditSummary?.actionsTotal ??
                                        null
                                    }
                                    byAction={
                                        followUpAuditSummary?.byAction ?? []
                                    }
                                    byReason={
                                        followUpAuditSummary?.byReason ?? []
                                    }
                                    byDay={followUpAuditSummary?.byDay ?? []}
                                />
                                <section
                                    className="border rounded bg-white p-3"
                                    data-testid="reception-cancellation-requests"
                                >
                                    <h2 className="h6 mb-2">
                                        Prośby o anulowanie
                                    </h2>
                                    {cancellationRequestsLoading ? (
                                        <div className="small text-muted">
                                            Ładowanie próśb...
                                        </div>
                                    ) : null}
                                    {cancellationRequestsError ? (
                                        <div className="alert alert-warning py-2 mb-0">
                                            Nie udało się pobrać próśb o
                                            anulowanie. Spróbuj odświeżyć widok.
                                        </div>
                                    ) : null}
                                    {!cancellationRequestsLoading &&
                                    !cancellationRequestsError &&
                                    cancellationRequests.length === 0 ? (
                                        <div className="small text-muted">
                                            Brak aktywnych próśb o anulowanie.
                                        </div>
                                    ) : null}
                                    {!cancellationRequestsLoading &&
                                    !cancellationRequestsError &&
                                    cancellationRequests.length > 0 ? (
                                        <div className="table-responsive">
                                            <table className="table table-sm align-middle mb-0">
                                                <thead>
                                                    <tr>
                                                        <th scope="col">
                                                            Klient
                                                        </th>
                                                        <th scope="col">
                                                            Termin
                                                        </th>
                                                        <th scope="col">
                                                            Usługa
                                                        </th>
                                                        <th scope="col">
                                                            Powód
                                                        </th>
                                                        <th scope="col">
                                                            Czas zgłoszenia
                                                        </th>
                                                        <th scope="col">
                                                            Akcje
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {cancellationRequests.map(
                                                        (request) => {
                                                            const actionState =
                                                                cancellationRequestActionStateByAppointmentId[
                                                                    request
                                                                        .appointmentId
                                                                ];
                                                            return (
                                                                <tr
                                                                    key={`${request.appointmentId}:${request.requestedAt}`}
                                                                >
                                                                    <td>
                                                                        {request
                                                                            .client
                                                                            ?.name ??
                                                                            'Brak danych'}
                                                                    </td>
                                                                    <td>
                                                                        {request.startTime
                                                                            ? new Date(
                                                                                  request.startTime,
                                                                              ).toLocaleString(
                                                                                  'pl-PL',
                                                                              )
                                                                            : 'Brak danych'}
                                                                    </td>
                                                                    <td>
                                                                        {request
                                                                            .service
                                                                            ?.name ??
                                                                            'Brak danych'}
                                                                    </td>
                                                                    <td>
                                                                        {request.reason ??
                                                                            'Bez powodu'}
                                                                    </td>
                                                                    <td>
                                                                        {request.requestedAt
                                                                            ? new Date(
                                                                                  request.requestedAt,
                                                                              ).toLocaleString(
                                                                                  'pl-PL',
                                                                              )
                                                                            : 'Brak danych'}
                                                                    </td>
                                                                    <td>
                                                                        <button
                                                                            type="button"
                                                                            className="btn btn-outline-danger btn-sm"
                                                                            disabled={
                                                                                actionState?.status ===
                                                                                'pending'
                                                                            }
                                                                            onClick={() =>
                                                                                handleCancelFromRequestQueue(
                                                                                    request.appointmentId,
                                                                                )
                                                                            }
                                                                        >
                                                                            {actionState?.status ===
                                                                            'pending'
                                                                                ? 'Anulowanie...'
                                                                                : 'Anuluj wizytę'}
                                                                        </button>
                                                                        {actionState?.message ? (
                                                                            <div
                                                                                className={`small mt-1 ${
                                                                                    actionState.status ===
                                                                                    'error'
                                                                                        ? 'text-danger'
                                                                                        : 'text-success'
                                                                                }`}
                                                                            >
                                                                                {
                                                                                    actionState.message
                                                                                }
                                                                            </div>
                                                                        ) : null}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        },
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : null}
                                </section>
                                <div className="d-flex flex-wrap align-items-end gap-2 rounded border bg-white p-2">
                                    <div>
                                        <label
                                            className="form-label form-label-sm mb-1"
                                            htmlFor="reception-status-filter"
                                        >
                                            Status
                                        </label>
                                        <select
                                            id="reception-status-filter"
                                            className="form-select form-select-sm"
                                            value={receptionStatusFilter}
                                            onChange={(event) =>
                                                setReceptionStatusFilter(
                                                    event.target.value,
                                                )
                                            }
                                        >
                                            <option value="all">
                                                Wszystkie
                                            </option>
                                            <option value="scheduled">
                                                Zaplanowane
                                            </option>
                                            <option value="confirmed">
                                                Potwierdzone
                                            </option>
                                            <option value="in_progress">
                                                W trakcie
                                            </option>
                                            <option value="completed">
                                                Zakończone
                                            </option>
                                            <option value="cancelled">
                                                Anulowane
                                            </option>
                                            <option value="no_show">
                                                No-show
                                            </option>
                                        </select>
                                    </div>
                                    <div>
                                        <label
                                            className="form-label form-label-sm mb-1"
                                            htmlFor="reception-payment-filter"
                                        >
                                            Płatność
                                        </label>
                                        <select
                                            id="reception-payment-filter"
                                            className="form-select form-select-sm"
                                            value={receptionPaymentFilter}
                                            onChange={(event) =>
                                                setReceptionPaymentFilter(
                                                    event.target.value,
                                                )
                                            }
                                        >
                                            <option value="all">
                                                Wszystkie
                                            </option>
                                            <option value="unpaid">
                                                Nieopłacone
                                            </option>
                                            <option value="to_finalize">
                                                Do finalizacji
                                            </option>
                                        </select>
                                    </div>
                                    <div className="form-check pb-2">
                                        <input
                                            id="reception-alert-filter"
                                            type="checkbox"
                                            className="form-check-input"
                                            checked={receptionAlertFilter}
                                            onChange={(event) =>
                                                setReceptionAlertFilter(
                                                    event.target.checked,
                                                )
                                            }
                                        />
                                        <label
                                            className="form-check-label small"
                                            htmlFor="reception-alert-filter"
                                        >
                                            Tylko z alertem CRM
                                        </label>
                                    </div>
                                    <div className="form-check pb-2">
                                        <input
                                            id="reception-priority-filter"
                                            type="checkbox"
                                            className="form-check-input"
                                            checked={receptionPriorityFilter}
                                            onChange={(event) =>
                                                setReceptionPriorityFilter(
                                                    event.target.checked,
                                                )
                                            }
                                        />
                                        <label
                                            className="form-check-label small"
                                            htmlFor="reception-priority-filter"
                                        >
                                            Tylko priorytetowe
                                        </label>
                                    </div>
                                </div>
                                <ReceptionView
                                    appointments={receptionAppointments}
                                    loading={loading}
                                    customerAlertSeverityByCustomerId={
                                        customerAlertSeverityById
                                    }
                                    onActionTracked={(params) => {
                                        if (!params.customerAlertSeverity)
                                            return;
                                        setReceptionActionsOnAlertsCount(
                                            (current) => current + 1,
                                        );
                                    }}
                                    onChanged={() => {
                                        void refetch();
                                    }}
                                    onOpenFinalizeAppointment={(id) => {
                                        openAppointmentDeepLink(id);
                                    }}
                                    onOpenAppointment={(id) => {
                                        openAppointmentDeepLink(id);
                                    }}
                                />
                            </div>
                        ) : employeeMode ? (
                            <div className="d-flex flex-column gap-3">
                                <div className="d-flex flex-wrap align-items-end gap-3 rounded border bg-white p-2">
                                    <div>
                                        <label
                                            className="form-label form-label-sm mb-1"
                                            htmlFor="employee-calendar-date"
                                        >
                                            Data
                                        </label>
                                        <input
                                            id="employee-calendar-date"
                                            type="date"
                                            className="form-control form-control-sm"
                                            value={toDateParam(currentDate)}
                                            onChange={(event) => {
                                                const nextDate = new Date(
                                                    `${event.target.value}T00:00:00`,
                                                );
                                                if (
                                                    Number.isNaN(
                                                        nextDate.getTime(),
                                                    )
                                                )
                                                    return;
                                                setCurrentDate(nextDate);
                                                updateCalendarQuery({
                                                    date: toDateParam(nextDate),
                                                    view: 'employee',
                                                });
                                            }}
                                        />
                                    </div>
                                    <div className="form-check pb-2">
                                        <input
                                            id="employee-archive-mode"
                                            type="checkbox"
                                            className="form-check-input"
                                            checked={employeeArchiveMode}
                                            onChange={(event) =>
                                                setEmployeeArchiveMode(
                                                    event.target.checked,
                                                )
                                            }
                                        />
                                        <label
                                            className="form-check-label small"
                                            htmlFor="employee-archive-mode"
                                        >
                                            Pokaż archiwalne
                                        </label>
                                    </div>
                                </div>
                                <StaffAppointmentCalendarView
                                    appointments={employeeAppointments}
                                    loading={loading}
                                    readOnly={employeeArchiveMode}
                                    emptyTitle={
                                        employeeArchiveMode
                                            ? 'Brak wizyt archiwalnych.'
                                            : 'Brak wizyt na wybrany dzień'
                                    }
                                    emptyDescription={
                                        employeeArchiveMode
                                            ? 'Wybierz inną datę lub wyłącz tryb archiwum.'
                                            : 'Wybierz inną datę lub dodaj nową wizytę.'
                                    }
                                    onChanged={() => {
                                        void refetch();
                                    }}
                                    onOpenAppointment={(id) => {
                                        openAppointmentDeepLink(id);
                                    }}
                                />
                            </div>
                        ) : clientMode ? (
                            <ClientAppointmentHistoryView
                                currentDateParam={toDateParam(currentDate)}
                                futureAppointments={clientFutureAppointments}
                                archivedAppointments={
                                    clientArchivedAppointments
                                }
                                onDateChange={(nextDate) => {
                                    setCurrentDate(nextDate);
                                    updateCalendarQuery({
                                        date: toDateParam(nextDate),
                                        view: 'client',
                                    });
                                }}
                                onRequestCancellation={async (
                                    appointmentId,
                                ) => {
                                    await apiFetch(
                                        `/appointments/${appointmentId}/cancellation-request`,
                                        {
                                            method: 'POST',
                                            headers: {
                                                'Content-Type':
                                                    'application/json',
                                            },
                                            body: JSON.stringify({}),
                                        },
                                    );
                                }}
                                onAcceptReschedule={async (appointmentId) => {
                                    await apiFetch(
                                        `/appointments/${appointmentId}/status`,
                                        {
                                            method: 'PATCH',
                                            headers: {
                                                'Content-Type':
                                                    'application/json',
                                            },
                                            body: JSON.stringify({
                                                status: 'confirmed',
                                            }),
                                        },
                                    );
                                    void refetch();
                                }}
                            />
                        ) : (
                            <CalendarView
                                events={data?.events ?? []}
                                employees={data?.employees ?? []}
                                customerAlertSeverityById={
                                    customerAlertSeverityById
                                }
                                loading={loading}
                                onEventClick={handleEventClick}
                                onEventDrop={handleEventDrop}
                                onDateSelect={(start, end, employeeId) =>
                                    setDrawer({
                                        open: true,
                                        mode: 'create',
                                        appointment: null,
                                        initialStartTime: start,
                                        initialEndTime: end,
                                        initialEmployeeId: employeeId,
                                    })
                                }
                                onViewChange={(nextView) => {
                                    setCurrentView(nextView);
                                    updateCalendarQuery({ view: nextView });
                                }}
                                onEmployeeFilterChange={(ids) => {
                                    setSelectedEmployeeIds(ids);
                                    updateCalendarQuery({ employeeIds: ids });
                                }}
                                onDateChange={(date) => {
                                    setCurrentDate(date);
                                    updateCalendarQuery({
                                        date: toDateParam(date),
                                    });
                                }}
                                currentDate={currentDate}
                                currentView={currentView}
                                selectedEmployeeIds={selectedEmployeeIds}
                                hideSidebar
                            />
                        )}
                    </div>
                </div>

                <AppointmentDrawer
                    open={drawer.open}
                    mode={drawer.mode}
                    appointment={drawer.appointment}
                    initialStartTime={drawer.initialStartTime}
                    initialEndTime={drawer.initialEndTime}
                    initialEmployeeId={drawer.initialEmployeeId}
                    initialServiceId={drawer.initialServiceId}
                    onClose={() => {
                        clearAppointmentDeepLink();
                        setDrawer((current) => ({
                            ...current,
                            open: false,
                        }));
                    }}
                    onSaved={() => {
                        void refetch();
                    }}
                />
            </SalonShell>
        </RouteGuard>
    );
}
