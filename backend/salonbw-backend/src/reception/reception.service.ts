import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateReceptionOperationalEventDto } from './dto/create-reception-operational-event.dto';
import { ReceptionOperationalEvent } from './entities/reception-operational-event.entity';

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

@Injectable()
export class ReceptionService {
    constructor(
        @InjectRepository(ReceptionOperationalEvent)
        private readonly receptionEventsRepo: Repository<ReceptionOperationalEvent>,
    ) {}

    async createOperationalEvent(
        dto: CreateReceptionOperationalEventDto,
    ): Promise<ReceptionOperationalEventResponse> {
        const occurredAt = dto.occurredAt ? new Date(dto.occurredAt) : new Date();

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
            .addSelect(
                'COUNT(event.customerAlertSeverity)',
                'actionsOnAlerts',
            )
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
}
