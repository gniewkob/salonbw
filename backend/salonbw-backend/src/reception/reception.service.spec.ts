import { Repository } from 'typeorm';
import { CreateReceptionOperationalEventDto } from './dto/create-reception-operational-event.dto';
import { ReceptionOperationalEvent } from './entities/reception-operational-event.entity';
import { ReceptionService } from './reception.service';

describe('ReceptionService', () => {
    let service: ReceptionService;
    let repo: jest.Mocked<Repository<ReceptionOperationalEvent>>;

    beforeEach(() => {
        repo = {
            create: jest.fn(),
            save: jest.fn(),
        } as unknown as jest.Mocked<Repository<ReceptionOperationalEvent>>;

        service = new ReceptionService(repo);
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
});
