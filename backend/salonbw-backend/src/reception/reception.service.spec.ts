import { Repository } from 'typeorm';
import { Appointment } from '../appointments/appointment.entity';
import { CreateCrmFollowUpActionDto } from './dto/create-crm-follow-up-action.dto';
import { CreateReceptionOperationalEventDto } from './dto/create-reception-operational-event.dto';
import { CrmFollowUpAction } from './entities/crm-follow-up-action.entity';
import { ReceptionOperationalEvent } from './entities/reception-operational-event.entity';
import { ReceptionService } from './reception.service';

describe('ReceptionService', () => {
    let service: ReceptionService;
    let appointmentsRepo: jest.Mocked<Repository<Appointment>>;
    let repo: jest.Mocked<Repository<ReceptionOperationalEvent>>;
    let followUpActionsRepo: jest.Mocked<Repository<CrmFollowUpAction>>;

    beforeEach(() => {
        appointmentsRepo = {
            query: jest.fn(),
        } as unknown as jest.Mocked<Repository<Appointment>>;

        repo = {
            create: jest.fn(),
            save: jest.fn(),
            query: jest.fn(),
        } as unknown as jest.Mocked<Repository<ReceptionOperationalEvent>>;

        followUpActionsRepo = {
            create: jest.fn(),
            save: jest.fn(),
            query: jest.fn(),
        } as unknown as jest.Mocked<Repository<CrmFollowUpAction>>;

        service = new ReceptionService(
            appointmentsRepo,
            repo,
            followUpActionsRepo,
        );
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('saves event through repository and defaults occurredAt when missing', async () => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2026-05-11T10:00:00.000Z'));

        const dto: CreateReceptionOperationalEventDto = {
            eventName: 'reception_operational_action',
            action: 'open_appointment_drawer',
            appointmentId: 42,
            source: 'reception_view',
        };

        repo.create.mockImplementation((payload) => payload as ReceptionOperationalEvent);
        repo.save.mockImplementation(async (entity) => ({
            id: 1,
            createdAt: new Date('2026-05-11T10:00:01.000Z'),
            ...entity,
        }));

        const result = await service.createOperationalEvent(dto);

        expect(repo.create).toHaveBeenCalledWith(
            expect.objectContaining({
                eventName: 'reception_operational_action',
                action: 'open_appointment_drawer',
                appointmentId: 42,
                customerId: null,
                customerAlertSeverity: null,
                source: 'reception_view',
                occurredAt: new Date('2026-05-11T10:00:00.000Z'),
            }),
        );
        expect(repo.save).toHaveBeenCalled();
        expect(result).toEqual(
            expect.objectContaining({
                id: 1,
                eventName: 'reception_operational_action',
                action: 'open_appointment_drawer',
                appointmentId: 42,
                customerId: null,
                customerAlertSeverity: null,
                source: 'reception_view',
            }),
        );
    });

    it('preserves provided occurredAt date', async () => {
        const dto: CreateReceptionOperationalEventDto = {
            eventName: 'reception_operational_action',
            action: 'start_appointment',
            appointmentId: 99,
            customerId: 8,
            customerAlertSeverity: 'warning',
            source: 'appointment_drawer',
            occurredAt: '2026-05-10T12:30:00.000Z',
        };

        repo.create.mockImplementation((payload) => payload as ReceptionOperationalEvent);
        repo.save.mockImplementation(async (entity) => ({
            id: 2,
            createdAt: new Date('2026-05-10T12:30:10.000Z'),
            ...entity,
        }));

        const result = await service.createOperationalEvent(dto);

        expect(repo.create).toHaveBeenCalledWith(
            expect.objectContaining({
                occurredAt: new Date('2026-05-10T12:30:00.000Z'),
            }),
        );
        expect(result.occurredAt.toISOString()).toBe('2026-05-10T12:30:00.000Z');
    });

    it('does not persist fields outside DTO shape', async () => {
        const dto = {
            eventName: 'reception_operational_action',
            action: 'open_sale_detail',
            appointmentId: 55,
            source: 'calendar',
            // should never reach repository payload
            clientName: 'Sensitive Name',
            notes: 'Sensitive note',
        } as unknown as CreateReceptionOperationalEventDto;

        repo.create.mockImplementation((payload) => payload as ReceptionOperationalEvent);
        repo.save.mockImplementation(async (entity) => ({
            id: 3,
            createdAt: new Date('2026-05-10T12:30:10.000Z'),
            ...entity,
        }));

        await service.createOperationalEvent(dto);

        const payload = repo.create.mock.calls[0][0] as Record<string, unknown>;
        expect(payload.clientName).toBeUndefined();
        expect(payload.notes).toBeUndefined();
    });

    it('returns daily operational summary counts', async () => {
        const whereMock = jest.fn().mockReturnThis();
        const andWhereMock = jest.fn().mockReturnThis();
        const selectMock = jest.fn().mockReturnThis();
        const addSelectMock = jest.fn().mockReturnThis();
        const getRawOneMock = jest.fn().mockResolvedValue({
            actionsTotal: '7',
            actionsOnAlerts: '3',
        });
        const qbMock = {
            select: selectMock,
            addSelect: addSelectMock,
            where: whereMock,
            andWhere: andWhereMock,
            getRawOne: getRawOneMock,
        };
        (
            repo as unknown as { createQueryBuilder: jest.Mock }
        ).createQueryBuilder = jest.fn().mockReturnValue(qbMock);

        const result = await service.getOperationalSummary('2026-05-11');

        expect(result).toEqual({
            date: '2026-05-11',
            actionsTotal: 7,
            actionsOnAlerts: 3,
        });
        expect(selectMock).toHaveBeenCalledWith('COUNT(*)', 'actionsTotal');
        expect(addSelectMock).toHaveBeenCalledWith(
            'COUNT(event.customerAlertSeverity)',
            'actionsOnAlerts',
        );
        expect(whereMock).toHaveBeenCalledWith(
            'event.eventName = :eventName',
            { eventName: 'reception_operational_action' },
        );
        expect(andWhereMock).toHaveBeenNthCalledWith(
            1,
            'event.occurredAt >= :start',
            expect.objectContaining({
                start: new Date('2026-05-11T00:00:00.000'),
            }),
        );
        expect(andWhereMock).toHaveBeenNthCalledWith(
            2,
            'event.occurredAt < :end',
            expect.objectContaining({
                end: new Date('2026-05-12T00:00:00.000'),
            }),
        );
    });

    it('defaults summary counts to zero when query returns empty', async () => {
        const qbMock = {
            select: jest.fn().mockReturnThis(),
            addSelect: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            getRawOne: jest.fn().mockResolvedValue(undefined),
        };
        (
            repo as unknown as { createQueryBuilder: jest.Mock }
        ).createQueryBuilder = jest.fn().mockReturnValue(qbMock);

        const result = await service.getOperationalSummary('2026-05-11');

        expect(result).toEqual({
            date: '2026-05-11',
            actionsTotal: 0,
            actionsOnAlerts: 0,
        });
    });

    it('returns operational insights for date range using DB aggregates', async () => {
        repo.query
            .mockResolvedValueOnce([{ actionsTotal: 10, actionsOnAlerts: 4 }])
            .mockResolvedValueOnce([
                {
                    action: 'start_appointment',
                    actionsTotal: 6,
                    actionsOnAlerts: 3,
                },
                {
                    action: 'mark_no_show',
                    actionsTotal: 4,
                    actionsOnAlerts: 1,
                },
            ])
            .mockResolvedValueOnce([
                { day: '2026-05-01', actionsTotal: 5, actionsOnAlerts: 2 },
                { day: '2026-05-02', actionsTotal: 5, actionsOnAlerts: 2 },
            ]);

        const result = await service.getOperationalInsights(
            '2026-05-01',
            '2026-05-02',
        );

        expect(result).toEqual({
            from: '2026-05-01',
            to: '2026-05-02',
            summary: {
                actionsTotal: 10,
                actionsOnAlerts: 4,
                alertActionRate: 0.4,
            },
            byAction: [
                {
                    action: 'start_appointment',
                    actionsTotal: 6,
                    actionsOnAlerts: 3,
                    alertActionRate: 0.5,
                },
                {
                    action: 'mark_no_show',
                    actionsTotal: 4,
                    actionsOnAlerts: 1,
                    alertActionRate: 0.25,
                },
            ],
            byDay: [
                {
                    day: '2026-05-01',
                    actionsTotal: 5,
                    actionsOnAlerts: 2,
                    alertActionRate: 0.4,
                },
                {
                    day: '2026-05-02',
                    actionsTotal: 5,
                    actionsOnAlerts: 2,
                    alertActionRate: 0.4,
                },
            ],
        });

        expect(repo.query).toHaveBeenNthCalledWith(
            1,
            expect.stringContaining('COUNT(*)::int AS "actionsTotal"'),
            [
                'reception_operational_action',
                new Date('2026-05-01T00:00:00.000'),
                new Date('2026-05-03T00:00:00.000'),
            ],
        );
        expect(repo.query).toHaveBeenCalledTimes(3);
    });

    it('returns zero-safe insights when totals are empty', async () => {
        repo.query
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([]);

        const result = await service.getOperationalInsights(
            '2026-05-01',
            '2026-05-01',
        );

        expect(result.summary).toEqual({
            actionsTotal: 0,
            actionsOnAlerts: 0,
            alertActionRate: 0,
        });
        expect(result.byAction).toEqual([]);
        expect(result.byDay).toEqual([]);
    });

    it('returns follow-up action audit summary for date range', async () => {
        followUpActionsRepo.query
            .mockResolvedValueOnce([{ actionsTotal: 5 }])
            .mockResolvedValueOnce([
                { action: 'contacted', count: 3 },
                { action: 'deferred', count: 2 },
            ])
            .mockResolvedValueOnce([
                { reason: 'recent_no_show', count: 4 },
                { reason: 'stale_in_progress', count: 1 },
            ])
            .mockResolvedValueOnce([
                { day: '2026-05-01', count: 2 },
                { day: '2026-05-02', count: 3 },
            ]);

        const result = await service.getFollowUpActionAuditSummary(
            '2026-05-01',
            '2026-05-02',
        );

        expect(result).toEqual({
            from: '2026-05-01',
            to: '2026-05-02',
            actionsTotal: 5,
            byAction: [
                { action: 'contacted', count: 3 },
                { action: 'deferred', count: 2 },
            ],
            byReason: [
                { reason: 'recent_no_show', count: 4 },
                { reason: 'stale_in_progress', count: 1 },
            ],
            byDay: [
                { day: '2026-05-01', count: 2 },
                { day: '2026-05-02', count: 3 },
            ],
        });

        expect(followUpActionsRepo.query).toHaveBeenCalledTimes(4);
    });

    it('returns latest follow-up actions for a customer sorted by occurredAt DESC', async () => {
        followUpActionsRepo.query.mockResolvedValueOnce([
            {
                id: 10,
                appointmentId: 901,
                candidateReason: 'recent_no_show',
                action: 'contacted',
                occurredAt: '2026-05-16T10:00:00.000Z',
                note: 'should not be in response',
            },
            {
                id: 9,
                appointmentId: 900,
                candidateReason: 'stale_in_progress',
                action: 'deferred',
                occurredAt: '2026-05-15T09:00:00.000Z',
                note: 'should not be in response',
            },
        ]);

        const result = await service.getCustomerFollowUpActions(123, 10);

        expect(followUpActionsRepo.query).toHaveBeenCalledWith(
            expect.stringContaining('WHERE "customerId" = $1'),
            [123, 10],
        );
        expect(result.customerId).toBe(123);
        expect(result.items).toEqual([
            {
                id: 10,
                appointmentId: 901,
                candidateReason: 'recent_no_show',
                action: 'contacted',
                occurredAt: new Date('2026-05-16T10:00:00.000Z'),
            },
            {
                id: 9,
                appointmentId: 900,
                candidateReason: 'stale_in_progress',
                action: 'deferred',
                occurredAt: new Date('2026-05-15T09:00:00.000Z'),
            },
        ]);
        expect((result.items[0] as { note?: unknown }).note).toBeUndefined();
    });

    it('returns empty customer follow-up actions list when there are no rows', async () => {
        followUpActionsRepo.query.mockResolvedValueOnce([]);

        const result = await service.getCustomerFollowUpActions(555, 5);

        expect(result).toEqual({
            customerId: 555,
            items: [],
        });
    });

    it('returns zero-safe follow-up action audit summary when empty', async () => {
        followUpActionsRepo.query
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([]);

        const result = await service.getFollowUpActionAuditSummary(
            '2026-05-01',
            '2026-05-01',
        );

        expect(result).toEqual({
            from: '2026-05-01',
            to: '2026-05-01',
            actionsTotal: 0,
            byAction: [],
            byReason: [],
            byDay: [],
        });
    });

    it('returns prioritized follow-up candidates for a day', async () => {
        appointmentsRepo.query
            .mockResolvedValueOnce([
                { customerId: 12, appointmentId: 1201 },
                { customerId: 14, appointmentId: 1401 },
            ])
            .mockResolvedValueOnce([
                { customerId: 11, appointmentId: 1101 },
                { customerId: 12, appointmentId: 1202 },
            ])
            .mockResolvedValueOnce([{ customerId: 15, appointmentId: 1501 }]);
        followUpActionsRepo.query.mockResolvedValueOnce([]);

        const result = await service.getFollowUpCandidates('2026-05-12');

        expect(result).toEqual([
            {
                customerId: 11,
                appointmentId: 1101,
                reason: 'stale_in_progress',
                priority: 'critical',
                suggestedAction: 'finalize_or_update_status',
            },
            {
                customerId: 12,
                appointmentId: 1202,
                reason: 'stale_in_progress',
                priority: 'critical',
                suggestedAction: 'finalize_or_update_status',
            },
            {
                customerId: 12,
                appointmentId: 1201,
                reason: 'recent_no_show',
                priority: 'high',
                suggestedAction: 'contact_customer',
            },
            {
                customerId: 14,
                appointmentId: 1401,
                reason: 'recent_no_show',
                priority: 'high',
                suggestedAction: 'contact_customer',
            },
            {
                customerId: 15,
                appointmentId: 1501,
                reason: 'high_risk_no_contact',
                priority: 'medium',
                suggestedAction: 'review_customer_timeline',
            },
        ]);
        expect(appointmentsRepo.query).toHaveBeenCalledTimes(3);
        expect(followUpActionsRepo.query).toHaveBeenCalledTimes(1);
    });

    it('skips malformed follow-up rows and returns empty by default', async () => {
        appointmentsRepo.query
            .mockResolvedValueOnce([{ customerId: null, appointmentId: null }])
            .mockResolvedValueOnce([{ customerId: 'abc', appointmentId: 1 }])
            .mockResolvedValueOnce([]);
        followUpActionsRepo.query.mockResolvedValueOnce([]);

        const result = await service.getFollowUpCandidates('2026-05-12');

        expect(result).toEqual([]);
    });

    it('suppresses handled candidates by follow-up actions policy', async () => {
        appointmentsRepo.query
            .mockResolvedValueOnce([
                { customerId: 12, appointmentId: 1201 },
                { customerId: 14, appointmentId: 1401 },
            ])
            .mockResolvedValueOnce([{ customerId: 11, appointmentId: 1101 }])
            .mockResolvedValueOnce([{ customerId: 15, appointmentId: 1501 }]);

        followUpActionsRepo.query.mockResolvedValueOnce([
            {
                customerId: 12,
                candidateReason: 'recent_no_show',
                action: 'contacted',
            },
            {
                customerId: 11,
                candidateReason: 'stale_in_progress',
                action: 'deferred',
            },
            {
                customerId: 15,
                candidateReason: 'high_risk_no_contact',
                action: 'dismissed',
            },
            {
                customerId: 14,
                candidateReason: 'recent_no_show',
                action: 'escalated',
            },
        ]);

        const result = await service.getFollowUpCandidates('2026-05-12');

        expect(result).toEqual([
            {
                customerId: 14,
                appointmentId: 1401,
                reason: 'recent_no_show',
                priority: 'high',
                suggestedAction: 'contact_customer',
            },
        ]);
    });

    it('saves follow-up action and defaults occurredAt when missing', async () => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2026-05-12T10:00:00.000Z'));

        const dto: CreateCrmFollowUpActionDto = {
            customerId: 123,
            appointmentId: 456,
            candidateReason: 'recent_no_show',
            action: 'contacted',
        };

        followUpActionsRepo.create.mockImplementation(
            (payload) => payload as CrmFollowUpAction,
        );
        followUpActionsRepo.save.mockImplementation(async (entity) => ({
            id: 1,
            createdAt: new Date('2026-05-12T10:00:01.000Z'),
            ...entity,
        }));

        const result = await service.createFollowUpAction(dto);

        expect(followUpActionsRepo.create).toHaveBeenCalledWith(
            expect.objectContaining({
                customerId: 123,
                appointmentId: 456,
                candidateReason: 'recent_no_show',
                action: 'contacted',
                note: null,
                occurredAt: new Date('2026-05-12T10:00:00.000Z'),
            }),
        );
        expect(result).toEqual(
            expect.objectContaining({
                customerId: 123,
                appointmentId: 456,
                candidateReason: 'recent_no_show',
                action: 'contacted',
                note: null,
            }),
        );
    });

    it('preserves provided follow-up action occurredAt and trims note', async () => {
        const dto: CreateCrmFollowUpActionDto = {
            customerId: 123,
            appointmentId: 456,
            candidateReason: 'stale_in_progress',
            action: 'escalated',
            note: '  Requires manager callback  ',
            occurredAt: '2026-05-12T11:00:00.000Z',
        };

        followUpActionsRepo.create.mockImplementation(
            (payload) => payload as CrmFollowUpAction,
        );
        followUpActionsRepo.save.mockImplementation(async (entity) => ({
            id: 2,
            createdAt: new Date('2026-05-12T11:00:01.000Z'),
            ...entity,
        }));

        const result = await service.createFollowUpAction(dto);

        expect(followUpActionsRepo.create).toHaveBeenCalledWith(
            expect.objectContaining({
                note: 'Requires manager callback',
                occurredAt: new Date('2026-05-12T11:00:00.000Z'),
            }),
        );
        expect(result.occurredAt.toISOString()).toBe('2026-05-12T11:00:00.000Z');
    });
});
