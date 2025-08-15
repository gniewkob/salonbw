import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommissionsService } from './commissions.service';
import { Commission } from './commission.entity';
import { CommissionRule } from './commission-rule.entity';
import { Appointment } from '../appointments/appointment.entity';
import { LogService } from '../logs/log.service';
import { LogAction } from '../logs/log-action.enum';
import { User } from '../users/user.entity';
import { Service as SalonService } from '../services/service.entity';

describe('CommissionsService', () => {
    let service: CommissionsService;
    let repo: jest.Mocked<Repository<Commission>>;
    let rulesRepo: jest.Mocked<Repository<CommissionRule>>;
    let logService: LogService;

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

    const mockRulesRepository = (): jest.Mocked<Repository<CommissionRule>> =>
        ({ findOne: jest.fn() }) as unknown as jest.Mocked<
            Repository<CommissionRule>
        >;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CommissionsService,
                {
                    provide: getRepositoryToken(Commission),
                    useValue: mockRepository(),
                },
                {
                    provide: getRepositoryToken(CommissionRule),
                    useValue: mockRulesRepository(),
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
        rulesRepo = module.get<jest.Mocked<Repository<CommissionRule>>>(
            getRepositoryToken(CommissionRule),
        );
        logService = module.get<LogService>(LogService);
    });

    it('creates a commission', async () => {
        const createSpy = jest.spyOn(repo, 'create');
        const saveSpy = jest.spyOn(repo, 'save');
        const logSpy = jest.spyOn(logService, 'logAction');
        const user = { id: 1 } as User;
        await expect(service.create({ amount: 10 }, user)).resolves.toEqual({
            id: 1,
            amount: 10,
        });
        expect(createSpy).toHaveBeenCalledWith({ amount: 10 });
        expect(saveSpy).toHaveBeenCalled();
        expect(logSpy).toHaveBeenCalledWith(
            user,
            LogAction.COMMISSION_CREATED,
            expect.objectContaining({ commissionId: 1, amount: 10 }),
        );
    });

    it('creates commission from appointment', async () => {
        const appointment = {
            service: { price: 100 } as SalonService,
            employee: { id: 1 } as User,
        } as Appointment;
        const created = { id: 1 } as Commission;
        const user = { id: 1 } as User;
        const spy = jest
            .spyOn(service, 'calculateAndSaveCommission')
            .mockResolvedValue(created);
        await expect(
            service.createFromAppointment(appointment, user),
        ).resolves.toBe(created);
        expect(spy).toHaveBeenCalledWith(
            appointment.employee,
            appointment.service,
            appointment,
            user,
        );
    });

    it('calculates and saves commission', async () => {
        const employee = { id: 1 } as User;
        const salonService = { id: 1, price: 200 } as SalonService;
        const appointment = { id: 2 } as Appointment;
        const user = { id: 3 } as User;
        jest.spyOn(service, 'resolveCommissionPercent').mockResolvedValue(25);
        const createSpy = jest
            .spyOn(service, 'create')
            .mockResolvedValue({ id: 1 } as Commission);
        await service.calculateAndSaveCommission(
            employee,
            salonService,
            appointment,
            user,
        );
        expect(service.resolveCommissionPercent).toHaveBeenCalledWith(
            employee,
            salonService,
        );
        expect(createSpy).toHaveBeenCalledWith(
            {
                employee,
                appointment,
                amount: 50,
                percent: 25,
            },
            user,
        );
    });

    describe('resolveCommissionPercent', () => {
        it('uses service rule when available', async () => {
            rulesRepo.findOne.mockReset();
            const employee = { id: 1, commissionBase: 5 } as User;
            const salonService = { id: 2, category: 'cat' } as SalonService;
            rulesRepo.findOne.mockResolvedValueOnce({
                commissionPercent: 30,
            } as CommissionRule);
            await expect(
                service.resolveCommissionPercent(employee, salonService),
            ).resolves.toBe(30);
            expect(rulesRepo.findOne).toHaveBeenCalledTimes(1);
        });

        it('uses category rule when service rule missing', async () => {
            rulesRepo.findOne.mockReset();
            const employee = { id: 1, commissionBase: 5 } as User;
            const salonService = { id: 2, category: 'cat' } as SalonService;
            rulesRepo.findOne
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce({
                    commissionPercent: 20,
                } as CommissionRule);
            await expect(
                service.resolveCommissionPercent(employee, salonService),
            ).resolves.toBe(20);
            expect(rulesRepo.findOne).toHaveBeenCalledTimes(2);
        });

        it('falls back to employee base when no rule', async () => {
            rulesRepo.findOne.mockReset();
            const employee = { id: 1, commissionBase: 5 } as User;
            const salonService = { id: 2, category: 'cat' } as SalonService;
            rulesRepo.findOne
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(null);
            await expect(
                service.resolveCommissionPercent(employee, salonService),
            ).resolves.toBe(5);
        });
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
