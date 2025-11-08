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
import { AppCacheService } from '../cache/cache.service';

describe('ServicesService', () => {
    let service: ServicesService;
    let repo: jest.Mocked<Repository<Service>>;
    let serviceEntity: Service;
    let logService: jest.Mocked<LogService>;
    let cache: jest.Mocked<AppCacheService>;

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
                {
                    provide: AppCacheService,
                    useValue: {
                        get: jest.fn().mockResolvedValue(null),
                        set: jest.fn().mockResolvedValue(undefined),
                        del: jest.fn().mockResolvedValue(undefined),
                        wrap: jest.fn((key: string, fn: () => Promise<unknown>) => fn()),
                    } as unknown as jest.Mocked<AppCacheService>,
                },
            ],
        }).compile();

        service = module.get<ServicesService>(ServicesService);
        repo = module.get<jest.Mocked<Repository<Service>>>(
            getRepositoryToken(Service),
        );
        logService = module.get<jest.Mocked<LogService>>(LogService);
        cache = module.get<jest.Mocked<AppCacheService>>(AppCacheService);
        jest.clearAllMocks();
        cache.get.mockResolvedValue(null);
        cache.set.mockResolvedValue(undefined);
        cache.del.mockResolvedValue(undefined);
        cache.wrap.mockImplementation(async (_key, fn) => fn());
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
        cache.del.mockClear();
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
        expect(cache.del).toHaveBeenCalledWith('services:all');
        expect(cache.del).toHaveBeenCalledWith('services:1');
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
        cache.del.mockClear();
        await expect(service.create(dto, user)).resolves.toEqual(serviceEntity);
        expect(cache.del).toHaveBeenCalledWith('services:all');
        expect(cache.del).toHaveBeenCalledWith('services:1');
    });

    it('returns all services', async () => {
        const findSpy = jest.spyOn(repo, 'find');
        await expect(service.findAll()).resolves.toEqual([serviceEntity]);
        expect(findSpy).toHaveBeenCalled();
        expect(cache.wrap).toHaveBeenCalledWith(
            'services:all',
            expect.any(Function),
        );
    });

    it('reuses cached list on subsequent findAll calls', async () => {
        const findSpy = jest.spyOn(repo, 'find');
        cache.wrap.mockImplementationOnce(async (key, fn) => {
            const result = await fn();
            cache.wrap.mockImplementation(
                async (nextKey: string, nextFn: () => Promise<unknown>) =>
                    nextKey === key ? result : nextFn(),
            );
            return result;
        });

        await service.findAll();
        await service.findAll();

        expect(cache.wrap).toHaveBeenCalledTimes(2);
        expect(findSpy).toHaveBeenCalledTimes(1);
    });

    it('returns a service by id and caches it', async () => {
        const findOneSpy = jest.spyOn(repo, 'findOne');
        await expect(service.findOne(1)).resolves.toBe(serviceEntity);
        expect(findOneSpy).toHaveBeenCalledWith({ where: { id: 1 } });
        expect(cache.get).toHaveBeenCalledWith('services:1');
        expect(cache.set).toHaveBeenCalledWith(
            'services:1',
            expect.objectContaining({
                id: serviceEntity.id,
            }),
        );
    });

    it('returns cached service without hitting repository', async () => {
        cache.get.mockResolvedValueOnce(serviceEntity);
        const findOneSpy = jest.spyOn(repo, 'findOne');
        await expect(service.findOne(1)).resolves.toBe(serviceEntity);
        expect(cache.get).toHaveBeenCalledWith('services:1');
        expect(findOneSpy).not.toHaveBeenCalled();
        expect(cache.set).not.toHaveBeenCalled();
    });

    it('throws when service not found', async () => {
        const findOneSpy = jest.spyOn(repo, 'findOne').mockResolvedValue(null);
        await expect(service.findOne(2)).rejects.toBeInstanceOf(
            NotFoundException,
        );
        expect(findOneSpy).toHaveBeenCalledWith({ where: { id: 2 } });
        expect(cache.set).not.toHaveBeenCalled();
    });

    it('updates a service', async () => {
        const dto: UpdateServiceDto = { name: 'New' };
        const updateSpy = jest.spyOn(repo, 'update');
        const logSpy = jest.spyOn(logService, 'logAction');
        const user = { id: 1 } as User;
        cache.del.mockClear();
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
        expect(cache.del).toHaveBeenCalledWith('services:all');
        expect(cache.del).toHaveBeenCalledWith('services:1');
    });

    it('updates a service even if logging fails', async () => {
        const dto: UpdateServiceDto = { name: 'New' };
        jest.spyOn(logService, 'logAction').mockRejectedValueOnce(
            new Error('fail'),
        );
        const user = { id: 1 } as User;
        cache.del.mockClear();
        await expect(service.update(1, dto, user)).resolves.toBe(serviceEntity);
        expect(cache.del).toHaveBeenCalledWith('services:all');
        expect(cache.del).toHaveBeenCalledWith('services:1');
    });

    it('removes a service', async () => {
        const deleteSpy = jest.spyOn(repo, 'delete');
        const logSpy = jest.spyOn(logService, 'logAction');
        const user = { id: 1 } as User;
        cache.del.mockClear();
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
        expect(cache.del).toHaveBeenCalledWith('services:all');
        expect(cache.del).toHaveBeenCalledWith('services:1');
    });

    it('removes a service even if logging fails', async () => {
        const user = { id: 1 } as User;
        jest.spyOn(logService, 'logAction').mockRejectedValueOnce(
            new Error('fail'),
        );
        cache.del.mockClear();
        await expect(service.remove(1, user)).resolves.toBeUndefined();
        expect(cache.del).toHaveBeenCalledWith('services:all');
        expect(cache.del).toHaveBeenCalledWith('services:1');
    });
});
