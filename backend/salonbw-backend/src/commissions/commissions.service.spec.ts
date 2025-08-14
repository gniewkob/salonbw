import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommissionsService } from './commissions.service';
import { Commission } from './commission.entity';
import { Appointment } from '../appointments/appointment.entity';
import { LogService } from '../logs/log.service';

describe('CommissionsService', () => {
    let service: CommissionsService;
    let repo: jest.Mocked<Repository<Commission>>;
    let logService: LogService;
    const user = { userId: 1 };

    const mockRepository = (): jest.Mocked<Repository<Commission>> =>
        ({
            create: jest.fn<Commission, [Partial<Commission>]>(
                (dto) => dto as Commission,
            ),
            save: jest
                .fn<Promise<Commission>, [Commission]>()
                .mockImplementation((entity) =>
                    Promise.resolve({ id: 1, ...entity }),
                ),
            find: jest.fn<Promise<Commission[]>, []>().mockResolvedValue([]),
        }) as jest.Mocked<Repository<Commission>>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CommissionsService,
                {
                    provide: getRepositoryToken(Commission),
                    useValue: mockRepository(),
                },
                {
                    provide: LogService,
                    useValue: { logAction: jest.fn() },
                },
            ],
        }).compile();

        service = module.get<CommissionsService>(CommissionsService);
        repo = module.get<jest.Mocked<Repository<Commission>>>(
            getRepositoryToken(Commission),
        );
        logService = module.get<LogService>(LogService);
    });

    it('creates a commission', async () => {
        const createSpy = jest.spyOn(repo, 'create');
        const saveSpy = jest.spyOn(repo, 'save');
        const logSpy = jest.spyOn(logService, 'logAction');
        await expect(service.create({ amount: 10 }, user)).resolves.toEqual({
            id: 1,
            amount: 10,
        });
        expect(createSpy).toHaveBeenCalledWith({ amount: 10 });
        expect(saveSpy).toHaveBeenCalled();
        expect(logSpy).toHaveBeenCalledWith(
            expect.objectContaining({ id: user.userId }),
            expect.anything(),
            expect.anything(),
        );
    });

    it('creates commission from appointment', async () => {
        const appointment = {
            service: { price: 100, commissionPercent: 10 },
            employee: { id: 1 },
        } as Appointment;
        const expected = {
            employee: appointment.employee,
            appointment,
            amount: 10,
            percent: 10,
        };
        const created = { id: 1, ...expected } as Commission;
        const spy = jest
            .spyOn(service, 'create')
            .mockImplementation(() => Promise.resolve(created));
        await expect(
            service.createFromAppointment(appointment, user),
        ).resolves.toBe(created);
        expect(spy).toHaveBeenCalledWith(expected, user);
    });

    it('finds commissions for user', async () => {
        const findSpy = jest.spyOn(repo, 'find');
        await service.findForUser(2);
        expect(findSpy).toHaveBeenCalledWith({
            where: { employee: { id: 2 } },
            order: { createdAt: 'DESC' },
        });
    });

    it('finds all commissions', async () => {
        const findSpy = jest.spyOn(repo, 'find');
        await service.findAll();
        expect(findSpy).toHaveBeenCalledWith({
            order: { createdAt: 'DESC' },
        });
    });
});
