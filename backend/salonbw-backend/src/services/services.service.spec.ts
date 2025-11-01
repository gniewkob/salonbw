import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from './service.entity';
import { ServicesService } from './services.service';
import { UpdateServiceDto } from './dto/update-service.dto';
import { LogService } from '../logs/log.service';
import { LogAction } from '../logs/log-action.enum';
import { User } from '../users/user.entity';

describe('ServicesService', () => {
    let service: ServicesService;
    let repo: jest.Mocked<Repository<Service>>;
    let serviceEntity: Service;
    let logService: jest.Mocked<LogService>;

    const mockRepository = (): jest.Mocked<Repository<Service>> =>
        ({
            create: jest.fn<Service, [Partial<Service>]>(
                (dto) => dto as Service,
            ),
            save: jest.fn<Promise<Service>, [Service]>((entity) =>
                Promise.resolve({ ...serviceEntity, ...entity }),
            ),
            find: jest.fn<Promise<Service[]>, []>(() =>
                Promise.resolve([serviceEntity]),
            ),
            findOne: jest.fn<
                Promise<Service | null>,
                [{ where: { id: number } }]
            >(() => Promise.resolve(serviceEntity)),
            update: jest.fn<Promise<void>, [number, Partial<Service>]>(() =>
                Promise.resolve(),
            ),
            delete: jest.fn<Promise<void>, [number]>(() => Promise.resolve()),
        }) as unknown as jest.Mocked<Repository<Service>>;

    beforeEach(async () => {
        serviceEntity = {
            id: 1,
            name: 'Cut',
            description: 'Hair cut',
            duration: 30,
            price: 10,
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ServicesService,
                {
                    provide: getRepositoryToken(Service),
                    useValue: mockRepository(),
                },
                {
                    provide: LogService,
                    useValue: {
                        logAction: jest.fn(),
                    } as unknown as jest.Mocked<LogService>,
                },
            ],
        }).compile();

        service = module.get<ServicesService>(ServicesService);
        repo = module.get<jest.Mocked<Repository<Service>>>(
            getRepositoryToken(Service),
        );
        logService = module.get<jest.Mocked<LogService>>(LogService);
    });

    it('creates a service', async () => {
        const dto = {
            name: 'Cut',
            description: 'Hair cut',
            duration: 30,
            price: 10,
        };
        const createSpy = jest.spyOn(repo, 'create');
        const saveSpy = jest.spyOn(repo, 'save');
        const logSpy = jest.spyOn(logService, 'logAction');
        const user = { id: 1 } as User;
        await expect(service.create(dto, user)).resolves.toEqual(serviceEntity);
        expect(createSpy).toHaveBeenCalledWith(dto);
        expect(saveSpy).toHaveBeenCalled();
        expect(logSpy).toHaveBeenCalledWith(
            user,
            LogAction.SERVICE_CREATED,
            expect.objectContaining({
                serviceId: serviceEntity.id,
                name: serviceEntity.name,
            }),
        );
    });

    it('creates a service even if logging fails', async () => {
        const dto = {
            name: 'Cut',
            description: 'Hair cut',
            duration: 30,
            price: 10,
        };
        jest.spyOn(logService, 'logAction').mockRejectedValueOnce(
            new Error('fail'),
        );
        const user = { id: 1 } as User;
        await expect(service.create(dto, user)).resolves.toEqual(serviceEntity);
    });

    it('returns all services', async () => {
        const findSpy = jest.spyOn(repo, 'find');
        await expect(service.findAll()).resolves.toEqual([serviceEntity]);
        expect(findSpy).toHaveBeenCalled();
    });

    it('returns a service by id', async () => {
        const findOneSpy = jest.spyOn(repo, 'findOne');
        await expect(service.findOne(1)).resolves.toBe(serviceEntity);
        expect(findOneSpy).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('throws when service not found', async () => {
        const findOneSpy = jest.spyOn(repo, 'findOne').mockResolvedValue(null);
        await expect(service.findOne(2)).rejects.toBeInstanceOf(
            NotFoundException,
        );
        expect(findOneSpy).toHaveBeenCalledWith({ where: { id: 2 } });
    });

    it('updates a service', async () => {
        const dto: UpdateServiceDto = { name: 'New' };
        const updateSpy = jest.spyOn(repo, 'update');
        const logSpy = jest.spyOn(logService, 'logAction');
        const user = { id: 1 } as User;
        await expect(service.update(1, dto, user)).resolves.toBe(serviceEntity);
        expect(updateSpy).toHaveBeenCalledWith(1, dto);
        expect(logSpy).toHaveBeenCalledWith(
            user,
            LogAction.SERVICE_UPDATED,
            expect.objectContaining({
                serviceId: serviceEntity.id,
                name: serviceEntity.name,
            }),
        );
    });

    it('updates a service even if logging fails', async () => {
        const dto: UpdateServiceDto = { name: 'New' };
        jest.spyOn(logService, 'logAction').mockRejectedValueOnce(
            new Error('fail'),
        );
        const user = { id: 1 } as User;
        await expect(service.update(1, dto, user)).resolves.toBe(serviceEntity);
    });

    it('removes a service', async () => {
        const deleteSpy = jest.spyOn(repo, 'delete');
        const logSpy = jest.spyOn(logService, 'logAction');
        const user = { id: 1 } as User;
        await expect(service.remove(1, user)).resolves.toBeUndefined();
        expect(deleteSpy).toHaveBeenCalledWith(1);
        expect(logSpy).toHaveBeenCalledWith(
            user,
            LogAction.SERVICE_DELETED,
            expect.objectContaining({
                serviceId: serviceEntity.id,
                name: serviceEntity.name,
            }),
        );
    });

    it('removes a service even if logging fails', async () => {
        const user = { id: 1 } as User;
        jest.spyOn(logService, 'logAction').mockRejectedValueOnce(
            new Error('fail'),
        );
        await expect(service.remove(1, user)).resolves.toBeUndefined();
    });
});
