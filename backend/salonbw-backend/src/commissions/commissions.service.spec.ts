import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommissionsService } from './commissions.service';
import { Commission } from './commission.entity';
import { Appointment } from '../appointments/appointment.entity';

describe('CommissionsService', () => {
    let service: CommissionsService;
    let repo: jest.Mocked<Repository<Commission>>;

    const mockRepository = () => ({
        create: jest.fn().mockImplementation((dto) => dto as Commission),
        save: jest
            .fn()
            .mockImplementation((entity: Commission) =>
                Promise.resolve({ id: 1, ...entity }),
            ),
        find: jest.fn().mockResolvedValue([] as Commission[]),
    });

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CommissionsService,
                {
                    provide: getRepositoryToken(Commission),
                    useValue: mockRepository(),
                },
            ],
        }).compile();

        service = module.get<CommissionsService>(CommissionsService);
        repo = module.get(getRepositoryToken(Commission));
    });

    it('creates a commission', async () => {
        await expect(service.create({ amount: 10 })).resolves.toEqual({
            id: 1,
            amount: 10,
        });
        expect(repo.create).toHaveBeenCalledWith({ amount: 10 });
        expect(repo.save).toHaveBeenCalled();
    });

    it('creates commission from appointment', async () => {
        const appointment = {
            service: { price: 100, commissionPercent: 10 },
            employee: { id: 1 },
        } as unknown as Appointment;
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
        await expect(service.createFromAppointment(appointment)).resolves.toBe(
            created,
        );
        expect(spy).toHaveBeenCalledWith(expected);
    });

    it('finds commissions for user', async () => {
        await service.findForUser(2);
        expect(repo.find).toHaveBeenCalledWith({
            where: { employee: { id: 2 } },
            order: { createdAt: 'DESC' },
        });
    });

    it('finds all commissions', async () => {
        await service.findAll();
        expect(repo.find).toHaveBeenCalledWith({
            order: { createdAt: 'DESC' },
        });
    });
});
