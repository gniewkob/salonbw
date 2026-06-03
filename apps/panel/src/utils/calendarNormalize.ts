import {
    FOLLOW_UP_PRIORITY_SCORE,
    FOLLOW_UP_PRIORITY_VALUES,
    FOLLOW_UP_REASON_VALUES,
} from '@/types/calendar-page';
import type {
    CancellationRequestQueueItem,
    ReceptionFollowUpAuditResponse,
    ReceptionFollowUpCandidate,
    ReceptionOperationalInsightsResponse,
} from '@/types/calendar-page';

export function toSafeNonNegativeNumber(value: unknown): number {
    if (typeof value !== 'number' || Number.isNaN(value)) {
        return 0;
    }
    return value < 0 ? 0 : value;
}

export function normalizeAlertRateFraction(
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

export function normalizeOperationalInsightsResponse(
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

export function normalizeFollowUpCandidatesResponse(
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

export function normalizeFollowUpAuditResponse(
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

export function normalizeCancellationRequestsResponse(
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
