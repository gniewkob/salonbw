import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
    Appointment,
    AppointmentStatus,
} from '../appointments/appointment.entity';
import { Repository } from 'typeorm';
import { CreateCrmFollowUpActionDto } from './dto/create-crm-follow-up-action.dto';
import { CreateReceptionOperationalEventDto } from './dto/create-reception-operational-event.dto';
import { CrmFollowUpAction } from './entities/crm-follow-up-action.entity';
import { ReceptionOperationalEvent } from './entities/reception-operational-event.entity';
import { type CrmFollowUpAction as CrmFollowUpActionType } from './reception.constants';

export interface ReceptionOperationalEventResponse {
    id: number;
    eventName: string;
    action: string;
    appointmentId: number;
    customerId: number | null;
    customerAlertSeverity: string | null;
    source: string;
    occurredAt: Date;
    createdAt: Date;
}

export interface ReceptionOperationalSummaryResponse {
    date: string;
    actionsTotal: number;
    actionsOnAlerts: number;
}

export interface ReceptionOperationalInsightsResponse {
    from: string;
    to: string;
    summary: {
        actionsTotal: number;
        actionsOnAlerts: number;
        alertActionRate: number;
    };
    byAction: Array<{
        action: string;
        actionsTotal: number;
        actionsOnAlerts: number;
        alertActionRate: number;
    }>;
    byDay: Array<{
        day: string;
        actionsTotal: number;
        actionsOnAlerts: number;
        alertActionRate: number;
    }>;
}

export interface CrmFollowUpActionResponse {
    id: number;
    customerId: number;
    appointmentId: number;
    candidateReason: ReceptionFollowUpReason;
    action: CrmFollowUpActionType;
    note: string | null;
    occurredAt: Date;
    createdAt: Date;
}

export interface CrmFollowUpActionAuditSummaryResponse {
    from: string;
    to: string;
    actionsTotal: number;
    byAction: Array<{
        action: CrmFollowUpActionType;
        count: number;
    }>;
    byReason: Array<{
        reason: ReceptionFollowUpReason;
        count: number;
    }>;
    byDay: Array<{
        day: string;
        count: number;
    }>;
}

export type ReceptionFollowUpReason =
    | 'recent_no_show'
    | 'stale_in_progress'
    | 'high_risk_no_contact';

export type ReceptionFollowUpPriority = 'critical' | 'high' | 'medium';

export interface ReceptionFollowUpCandidate {
    customerId: number;
    appointmentId: number | null;
    reason: ReceptionFollowUpReason;
    priority: ReceptionFollowUpPriority;
    suggestedAction: string;
}

@Injectable()
export class ReceptionService {
    private static readonly CONTACT_GAP_DAYS = 30;
    private static readonly HIGH_RISK_NO_SHOWS = 2;
    private static readonly STALE_IN_PROGRESS_HOURS = 2;

    constructor(
        @InjectRepository(Appointment)
        private readonly appointmentsRepo: Repository<Appointment>,
        @InjectRepository(ReceptionOperationalEvent)
        private readonly receptionEventsRepo: Repository<ReceptionOperationalEvent>,
        @InjectRepository(CrmFollowUpAction)
        private readonly crmFollowUpActionsRepo: Repository<CrmFollowUpAction>,
    ) {}

    async createFollowUpAction(
        dto: CreateCrmFollowUpActionDto,
    ): Promise<CrmFollowUpActionResponse> {
        const occurredAt = dto.occurredAt
            ? new Date(dto.occurredAt)
            : new Date();

        const action = this.crmFollowUpActionsRepo.create({
            customerId: dto.customerId,
            appointmentId: dto.appointmentId,
            candidateReason: dto.candidateReason,
            action: dto.action,
            note: dto.note?.trim() ? dto.note.trim() : null,
            occurredAt,
        });

        const saved = await this.crmFollowUpActionsRepo.save(action);

        return {
            id: saved.id,
            customerId: saved.customerId,
            appointmentId: saved.appointmentId,
            candidateReason: saved.candidateReason,
            action: saved.action,
            note: saved.note,
            occurredAt: saved.occurredAt,
            createdAt: saved.createdAt,
        };
    }

    async getFollowUpActionAuditSummary(
        from: string,
        to: string,
    ): Promise<CrmFollowUpActionAuditSummaryResponse> {
        const start = new Date(`${from}T00:00:00.000`);
        const endExclusive = new Date(`${to}T00:00:00.000`);
        endExclusive.setDate(endExclusive.getDate() + 1);

        const summaryRows = await this.crmFollowUpActionsRepo.query(
            `SELECT COUNT(*)::int AS "actionsTotal"
             FROM crm_follow_up_actions
             WHERE "occurredAt" >= $1
               AND "occurredAt" < $2`,
            [start, endExclusive],
        );

        const byActionRows = await this.crmFollowUpActionsRepo.query(
            `SELECT
                "action" AS "action",
                COUNT(*)::int AS "count"
             FROM crm_follow_up_actions
             WHERE "occurredAt" >= $1
               AND "occurredAt" < $2
             GROUP BY "action"
             ORDER BY "count" DESC, "action" ASC`,
            [start, endExclusive],
        );

        const byReasonRows = await this.crmFollowUpActionsRepo.query(
            `SELECT
                "candidateReason" AS "reason",
                COUNT(*)::int AS "count"
             FROM crm_follow_up_actions
             WHERE "occurredAt" >= $1
               AND "occurredAt" < $2
             GROUP BY "candidateReason"
             ORDER BY "count" DESC, "candidateReason" ASC`,
            [start, endExclusive],
        );

        const byDayRows = await this.crmFollowUpActionsRepo.query(
            `SELECT
                TO_CHAR(DATE("occurredAt"), 'YYYY-MM-DD') AS "day",
                COUNT(*)::int AS "count"
             FROM crm_follow_up_actions
             WHERE "occurredAt" >= $1
               AND "occurredAt" < $2
             GROUP BY DATE("occurredAt")
             ORDER BY DATE("occurredAt") ASC`,
            [start, endExclusive],
        );

        return {
            from,
            to,
            actionsTotal: Number(summaryRows?.[0]?.actionsTotal ?? 0),
            byAction: (byActionRows ?? []).map(
                (row: { action: CrmFollowUpActionType; count: number }) => ({
                    action: row.action,
                    count: Number(row.count ?? 0),
                }),
            ),
            byReason: (byReasonRows ?? []).map(
                (row: { reason: ReceptionFollowUpReason; count: number }) => ({
                    reason: row.reason,
                    count: Number(row.count ?? 0),
                }),
            ),
            byDay: (byDayRows ?? []).map(
                (row: { day: string; count: number }) => ({
                    day: row.day,
                    count: Number(row.count ?? 0),
                }),
            ),
        };
    }

    async createOperationalEvent(
        dto: CreateReceptionOperationalEventDto,
    ): Promise<ReceptionOperationalEventResponse> {
        const occurredAt = dto.occurredAt
            ? new Date(dto.occurredAt)
            : new Date();

        const event = this.receptionEventsRepo.create({
            eventName: dto.eventName,
            action: dto.action,
            appointmentId: dto.appointmentId,
            customerId: dto.customerId ?? null,
            customerAlertSeverity: dto.customerAlertSeverity ?? null,
            source: dto.source,
            occurredAt,
        });

        const saved = await this.receptionEventsRepo.save(event);

        return {
            id: saved.id,
            eventName: saved.eventName,
            action: saved.action,
            appointmentId: saved.appointmentId,
            customerId: saved.customerId ?? null,
            customerAlertSeverity: saved.customerAlertSeverity ?? null,
            source: saved.source,
            occurredAt: saved.occurredAt,
            createdAt: saved.createdAt,
        };
    }

    async getOperationalSummary(
        date: string,
    ): Promise<ReceptionOperationalSummaryResponse> {
        const start = new Date(`${date}T00:00:00.000`);
        const end = new Date(start);
        end.setDate(end.getDate() + 1);

        const raw = await this.receptionEventsRepo
            .createQueryBuilder('event')
            .select('COUNT(*)', 'actionsTotal')
            .addSelect('COUNT(event.customerAlertSeverity)', 'actionsOnAlerts')
            .where('event.eventName = :eventName', {
                eventName: 'reception_operational_action',
            })
            .andWhere('event.occurredAt >= :start', { start })
            .andWhere('event.occurredAt < :end', { end })
            .getRawOne<{ actionsTotal: string; actionsOnAlerts: string }>();

        return {
            date,
            actionsTotal: Number(raw?.actionsTotal ?? 0),
            actionsOnAlerts: Number(raw?.actionsOnAlerts ?? 0),
        };
    }

    async getOperationalInsights(
        from: string,
        to: string,
    ): Promise<ReceptionOperationalInsightsResponse> {
        const start = new Date(`${from}T00:00:00.000`);
        const endExclusive = new Date(`${to}T00:00:00.000`);
        endExclusive.setDate(endExclusive.getDate() + 1);

        const summaryRows = await this.receptionEventsRepo.query(
            `SELECT
                COUNT(*)::int AS "actionsTotal",
                COUNT("customerAlertSeverity")::int AS "actionsOnAlerts"
             FROM reception_operational_events
             WHERE "eventName" = $1
               AND "occurredAt" >= $2
               AND "occurredAt" < $3`,
            ['reception_operational_action', start, endExclusive],
        );
        const summaryRow = summaryRows?.[0] ?? {
            actionsTotal: 0,
            actionsOnAlerts: 0,
        };
        const summaryTotal = Number(summaryRow.actionsTotal ?? 0);
        const summaryAlerts = Number(summaryRow.actionsOnAlerts ?? 0);

        const byActionRows = await this.receptionEventsRepo.query(
            `SELECT
                "action",
                COUNT(*)::int AS "actionsTotal",
                COUNT("customerAlertSeverity")::int AS "actionsOnAlerts"
             FROM reception_operational_events
             WHERE "eventName" = $1
               AND "occurredAt" >= $2
               AND "occurredAt" < $3
             GROUP BY "action"
             ORDER BY "actionsTotal" DESC, "action" ASC`,
            ['reception_operational_action', start, endExclusive],
        );

        const byDayRows = await this.receptionEventsRepo.query(
            `SELECT
                TO_CHAR(DATE("occurredAt"), 'YYYY-MM-DD') AS "day",
                COUNT(*)::int AS "actionsTotal",
                COUNT("customerAlertSeverity")::int AS "actionsOnAlerts"
             FROM reception_operational_events
             WHERE "eventName" = $1
               AND "occurredAt" >= $2
               AND "occurredAt" < $3
             GROUP BY DATE("occurredAt")
             ORDER BY DATE("occurredAt") ASC`,
            ['reception_operational_action', start, endExclusive],
        );

        return {
            from,
            to,
            summary: {
                actionsTotal: summaryTotal,
                actionsOnAlerts: summaryAlerts,
                alertActionRate:
                    summaryTotal > 0 ? summaryAlerts / summaryTotal : 0,
            },
            byAction: (byActionRows ?? []).map(
                (row: {
                    action: string;
                    actionsTotal: number | string;
                    actionsOnAlerts: number | string;
                }) => {
                    const actionsTotal = Number(row.actionsTotal ?? 0);
                    const actionsOnAlerts = Number(row.actionsOnAlerts ?? 0);
                    return {
                        action: row.action,
                        actionsTotal,
                        actionsOnAlerts,
                        alertActionRate:
                            actionsTotal > 0
                                ? actionsOnAlerts / actionsTotal
                                : 0,
                    };
                },
            ),
            byDay: (byDayRows ?? []).map(
                (row: {
                    day: string;
                    actionsTotal: number | string;
                    actionsOnAlerts: number | string;
                }) => {
                    const actionsTotal = Number(row.actionsTotal ?? 0);
                    const actionsOnAlerts = Number(row.actionsOnAlerts ?? 0);
                    return {
                        day: row.day,
                        actionsTotal,
                        actionsOnAlerts,
                        alertActionRate:
                            actionsTotal > 0
                                ? actionsOnAlerts / actionsTotal
                                : 0,
                    };
                },
            ),
        };
    }

    async getFollowUpCandidates(
        date: string,
    ): Promise<ReceptionFollowUpCandidate[]> {
        const dayStart = new Date(`${date}T00:00:00.000`);
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);

        const staleBefore = new Date(dayEnd);
        staleBefore.setHours(
            staleBefore.getHours() - ReceptionService.STALE_IN_PROGRESS_HOURS,
        );

        const contactGapStart = new Date(dayEnd);
        contactGapStart.setDate(
            contactGapStart.getDate() - ReceptionService.CONTACT_GAP_DAYS,
        );

        const noShowRows = await this.appointmentsRepo.query(
            `SELECT DISTINCT ON (apt."clientId")
                apt."clientId" AS "customerId",
                apt.id AS "appointmentId",
                apt."startTime" AS "relevantAt"
             FROM appointments apt
             WHERE apt.status = $1
               AND apt."startTime" >= $2
               AND apt."startTime" < $3
             ORDER BY apt."clientId", apt."startTime" DESC, apt.id DESC`,
            [AppointmentStatus.NoShow, dayStart, dayEnd],
        );

        const staleInProgressRows = await this.appointmentsRepo.query(
            `SELECT DISTINCT ON (apt."clientId")
                apt."clientId" AS "customerId",
                apt.id AS "appointmentId",
                apt."startTime" AS "relevantAt"
             FROM appointments apt
             WHERE apt.status = $1
               AND apt."finalizedAt" IS NULL
               AND apt."startTime" >= $2
               AND apt."startTime" < $3
               AND apt."startTime" < $4
             ORDER BY apt."clientId", apt."startTime" DESC, apt.id DESC`,
            [AppointmentStatus.InProgress, dayStart, dayEnd, staleBefore],
        );

        const highRiskRows = await this.appointmentsRepo.query(
            `SELECT DISTINCT ON (risk."clientId")
                risk."clientId" AS "customerId",
                risk.id AS "appointmentId",
                risk."startTime" AS "relevantAt"
             FROM appointments risk
             WHERE risk.status = $1
               AND risk."startTime" >= $2
               AND risk."startTime" < $3
               AND (
                    SELECT COUNT(*)
                    FROM appointments hist
                    WHERE hist."clientId" = risk."clientId"
                      AND hist.status = $1
               ) >= $4
               AND NOT EXISTS (
                    SELECT 1
                    FROM reception_operational_events ev
                    WHERE ev."eventName" = $5
                      AND ev."customerId" = risk."clientId"
                      AND ev."occurredAt" >= $6
                      AND ev."occurredAt" < $3
               )
             ORDER BY risk."clientId", risk."startTime" DESC, risk.id DESC`,
            [
                AppointmentStatus.NoShow,
                dayStart,
                dayEnd,
                ReceptionService.HIGH_RISK_NO_SHOWS,
                'reception_operational_action',
                contactGapStart,
            ],
        );

        const scored = new Map<
            string,
            ReceptionFollowUpCandidate & { score: number }
        >();

        this.mergeFollowUpRows(scored, noShowRows, {
            reason: 'recent_no_show',
            priority: 'high',
            suggestedAction: 'contact_customer',
            score: 2,
        });

        this.mergeFollowUpRows(scored, staleInProgressRows, {
            reason: 'stale_in_progress',
            priority: 'critical',
            suggestedAction: 'finalize_or_update_status',
            score: 3,
        });

        this.mergeFollowUpRows(scored, highRiskRows, {
            reason: 'high_risk_no_contact',
            priority: 'medium',
            suggestedAction: 'review_customer_timeline',
            score: 1,
        });

        const contactSuppressionStart = new Date(dayEnd);
        contactSuppressionStart.setDate(contactSuppressionStart.getDate() - 7);

        const handledRows = await this.crmFollowUpActionsRepo.query(
            `SELECT
                act."customerId" AS "customerId",
                act."candidateReason" AS "candidateReason",
                act."action" AS "action"
             FROM crm_follow_up_actions act
             WHERE (
                    act."action" = $1
                    AND act."occurredAt" >= $2
                    AND act."occurredAt" < $3
                )
                OR (
                    act."action" IN ($4, $5)
                    AND act."occurredAt" >= $6
                    AND act."occurredAt" < $3
                )`,
            [
                'contacted',
                contactSuppressionStart,
                dayEnd,
                'dismissed',
                'deferred',
                dayStart,
            ],
        );

        const suppressedKeys = new Set<string>();
        for (const row of handledRows ?? []) {
            if (!row || typeof row !== 'object') continue;
            const action = (row as { action?: unknown }).action;
            if (
                action !== 'contacted' &&
                action !== 'dismissed' &&
                action !== 'deferred'
            ) {
                continue;
            }
            const candidateReason = (row as { candidateReason?: unknown })
                .candidateReason;
            if (
                candidateReason !== 'recent_no_show' &&
                candidateReason !== 'stale_in_progress' &&
                candidateReason !== 'high_risk_no_contact'
            ) {
                continue;
            }

            const customerId = Number((row as { customerId?: unknown }).customerId);
            if (!Number.isInteger(customerId) || customerId <= 0) {
                continue;
            }

            suppressedKeys.add(`${customerId}:${candidateReason}`);
        }

        return Array.from(scored.values())
            .filter(
                (candidate) =>
                    !suppressedKeys.has(
                        `${candidate.customerId}:${candidate.reason}`,
                    ),
            )
            .sort((a, b) => b.score - a.score)
            .map(({ score: _score, ...candidate }) => candidate);
    }

    private mergeFollowUpRows(
        target: Map<string, ReceptionFollowUpCandidate & { score: number }>,
        rows: Array<{
            customerId: number | string;
            appointmentId: number | string | null;
        }>,
        template: {
            reason: ReceptionFollowUpReason;
            priority: ReceptionFollowUpPriority;
            suggestedAction: string;
            score: number;
        },
    ): void {
        for (const row of rows ?? []) {
            const customerId = Number(row.customerId);
            if (!Number.isInteger(customerId) || customerId <= 0) {
                continue;
            }

            const appointmentId =
                row.appointmentId === null || row.appointmentId === undefined
                    ? null
                    : Number(row.appointmentId);
            const key = `${customerId}:${template.reason}`;
            const existing = target.get(key);
            if (existing && existing.score >= template.score) {
                continue;
            }

            target.set(key, {
                customerId,
                appointmentId:
                    appointmentId !== null &&
                    Number.isInteger(appointmentId) &&
                    appointmentId > 0
                        ? appointmentId
                        : null,
                reason: template.reason,
                priority: template.priority,
                suggestedAction: template.suggestedAction,
                score: template.score,
            });
        }
    }
}
