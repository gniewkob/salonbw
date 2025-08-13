import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FormulasService } from './formulas.service';
import { Formula } from './formula.entity';
import {
    Appointment,
    AppointmentStatus,
} from '../appointments/appointment.entity';
import { User } from '../users/user.entity';

describe('FormulasService', () => {
    let service: FormulasService;
    let formulasRepo: jest.Mocked<Repository<Formula>>;
    let appointmentsRepo: jest.Mocked<Repository<Appointment>>;
    let appointment: Appointment;
    let client: User;

    const mockFormulasRepository = (): jest.Mocked<Repository<Formula>> =>
        ({
            create: jest.fn<Formula, [Partial<Formula>]>(
                (dto) => dto as Formula,
            ),
            save: jest.fn<Promise<Formula>, [Formula]>((entity) =>
                Promise.resolve({ id: 1, ...entity }),
            ),
            find: jest.fn<
                Promise<Formula[]>,
                [
                    {
                        where: { client: { id: number } };
                        order: { date: 'DESC' };
                    },
                ]
            >(() => Promise.resolve([{ id: 1 } as Formula])),
        }) as jest.Mocked<Repository<Formula>>;

    const mockAppointmentsRepository = (): jest.Mocked<
        Repository<Appointment>
    > =>
        ({
            findOne: jest.fn<
                Promise<Appointment | null>,
                [
                    {
                        where: { id: number };
                        select: string[];
                        relations: string[];
                    },
                ]
            >(() => Promise.resolve(appointment)),
        }) as jest.Mocked<Repository<Appointment>>;

    beforeEach(async () => {
        client = { id: 2 } as User;
        appointment = {
            id: 1,
            status: AppointmentStatus.Completed,
            employee: { id: 1 } as User,
            client,
        } as Appointment;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                FormulasService,
                {
                    provide: getRepositoryToken(Formula),
                    useValue: mockFormulasRepository(),
                },
                {
                    provide: getRepositoryToken(Appointment),
                    useValue: mockAppointmentsRepository(),
                },
            ],
        }).compile();

        service = module.get<FormulasService>(FormulasService);
        formulasRepo = module.get<jest.Mocked<Repository<Formula>>>(
            getRepositoryToken(Formula),
        );
        appointmentsRepo = module.get<jest.Mocked<Repository<Appointment>>>(
            getRepositoryToken(Appointment),
        );
    });

    it('adds formula to completed appointment', async () => {
        const data = { description: 'Cut', date: new Date('2023-01-01') };
        const createSpy = jest.spyOn(formulasRepo, 'create');
        const saveSpy = jest.spyOn(formulasRepo, 'save');
        const findOneSpy = jest.spyOn(appointmentsRepo, 'findOne');
        await expect(service.addToAppointment(1, 1, data)).resolves.toEqual({
            id: 1,
            description: 'Cut',
            date: data.date,
            client,
            appointment,
        });
        expect(findOneSpy).toHaveBeenCalledWith({
            where: { id: 1 },
            select: ['id', 'status'],
            relations: ['employee', 'client'],
        });
        expect(createSpy).toHaveBeenCalledWith({
            description: 'Cut',
            date: data.date,
            client,
            appointment,
        });
        expect(saveSpy).toHaveBeenCalled();
    });

    it('finds formulas for client', async () => {
        const findSpy = jest.spyOn(formulasRepo, 'find');
        await expect(service.findForClient(2)).resolves.toEqual([
            { id: 1 } as Formula,
        ]);
        expect(findSpy).toHaveBeenCalledWith({
            where: { client: { id: 2 } },
            order: { date: 'DESC' },
        });
    });
});
