/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductsService } from './products.service';
import { Product } from './product.entity';
import { NotFoundException } from '@nestjs/common';
import { LogService } from '../logs/log.service';
import { LogAction } from '../logs/log-action.enum';
import { User } from '../users/user.entity';
import { AppCacheService } from '../cache/cache.service';

describe('ProductsService', () => {
    let service: ProductsService;
    let repo: jest.Mocked<Repository<Product>>;
    let logService: jest.Mocked<LogService>;
    let cache: jest.Mocked<AppCacheService>;

    const mockRepository = (): jest.Mocked<Repository<Product>> =>
        ({
            create: jest.fn<Product, [Partial<Product>]>(
                (dto) => dto as Product,
            ),
            save: jest.fn<Promise<Product>, [Product]>((entity) =>
                Promise.resolve(Object.assign({ id: 1 }, entity) as Product),
            ),
            find: jest.fn<Promise<Product[]>, []>(() =>
                Promise.resolve([{ id: 1 } as Product]),
            ),
            findOne: jest.fn<
                Promise<Product | null>,
                [{ where: { id: number } }]
            >(() => Promise.resolve({ id: 1 } as Product)),
            update: jest.fn<Promise<void>, [number, Partial<Product>]>(() =>
                Promise.resolve(),
            ),
            delete: jest.fn<Promise<void>, [number]>(() => Promise.resolve()),
        }) as unknown as jest.Mocked<Repository<Product>>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ProductsService,
                {
                    provide: getRepositoryToken(Product),
                    useValue: mockRepository() as unknown as jest.Mocked<
                        Repository<Product>
                    >,
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
                        wrap: jest.fn(
                            (key: string, fn: () => Promise<unknown>) => fn(),
                        ),
                    } as unknown as jest.Mocked<AppCacheService>,
                },
            ],
        }).compile();

        service = module.get<ProductsService>(ProductsService);
        repo = module.get<jest.Mocked<Repository<Product>>>(
            getRepositoryToken(Product),
        );
        logService = module.get<jest.Mocked<LogService>>(LogService);
        cache = module.get<jest.Mocked<AppCacheService>>(AppCacheService);
        jest.clearAllMocks();
        cache.get.mockResolvedValue(null);
        cache.set.mockResolvedValue(undefined);
        cache.del.mockResolvedValue(undefined);
        cache.wrap.mockImplementation((_key, fn) => fn());
    });

    it('creates a product', async () => {
        const dto: Partial<Product> = {
            name: 'Shampoo',
            brand: 'Brand',
            unitPrice: 5,
            stock: 10,
        };
        const createSpy = jest.spyOn(repo, 'create');
        const saveSpy = jest.spyOn(repo, 'save');
        const logSpy = jest.spyOn(logService, 'logAction');
        const user = { id: 1 } as User;
        cache.del.mockClear();
        await expect(service.create(dto as Product, user)).resolves.toEqual({
            id: 1,
            ...dto,
        });
        expect(createSpy).toHaveBeenCalledWith(dto);
        expect(saveSpy).toHaveBeenCalled();
        expect(logSpy).toHaveBeenCalledWith(
            user,
            LogAction.PRODUCT_CREATED,
            expect.objectContaining({ productId: 1, name: 'Shampoo' }),
        );
        expect(cache.del).toHaveBeenCalledWith('products:all');
        expect(cache.del).toHaveBeenCalledWith('products:1');
    });

    it('returns all products', async () => {
        const findSpy = jest.spyOn(repo, 'find');
        await expect(service.findAll()).resolves.toEqual([{ id: 1 }]);
        expect(findSpy).toHaveBeenCalled();
        expect(cache.wrap).toHaveBeenCalledWith(
            'products:all',
            expect.any(Function),
        );
    });

    it('reuses cached list on subsequent findAll calls', async () => {
        const findSpy = jest.spyOn(repo, 'find');
        cache.wrap.mockImplementationOnce(async (key, fn) => {
            const result = await fn();
            cache.wrap.mockImplementation(
                (nextKey: string, nextFn: () => Promise<unknown>) =>
                    nextKey === key ? Promise.resolve(result) : nextFn(),
            );
            return result;
        });

        await service.findAll();
        await service.findAll();

        expect(cache.wrap).toHaveBeenCalledTimes(2);
        expect(findSpy).toHaveBeenCalledTimes(1);
    });

    it('returns a product by id and caches it', async () => {
        const findOneSpy = jest.spyOn(repo, 'findOne');
        await expect(service.findOne(1)).resolves.toEqual({ id: 1 });
        expect(findOneSpy).toHaveBeenCalledWith({ where: { id: 1 } });
        expect(cache.get).toHaveBeenCalledWith('products:1');
        expect(cache.set).toHaveBeenCalledWith(
            'products:1',
            expect.objectContaining({ id: 1 }),
        );
    });

    it('returns cached product without hitting repository', async () => {
        const product = { id: 1 } as Product;
        cache.get.mockResolvedValueOnce(product);
        const findOneSpy = jest.spyOn(repo, 'findOne');
        await expect(service.findOne(1)).resolves.toEqual(product);
        expect(cache.get).toHaveBeenCalledWith('products:1');
        expect(findOneSpy).not.toHaveBeenCalled();
        expect(cache.set).not.toHaveBeenCalled();
    });

    it('throws when product not found', async () => {
        const findOneSpy = jest.spyOn(repo, 'findOne').mockResolvedValue(null);
        await expect(service.findOne(2)).rejects.toBeInstanceOf(
            NotFoundException,
        );
        expect(findOneSpy).toHaveBeenCalledWith({ where: { id: 2 } });
        expect(cache.set).not.toHaveBeenCalled();
    });

    it('updates a product', async () => {
        const dto: Partial<Product> = { name: 'New' };
        const updateSpy = jest.spyOn(repo, 'update');
        const logSpy = jest.spyOn(logService, 'logAction');
        const user = { id: 1 } as User;
        cache.del.mockClear();
        await expect(service.update(1, dto as Product, user)).resolves.toEqual({
            id: 1,
        });
        expect(updateSpy).toHaveBeenCalledWith(1, dto);
        expect(logSpy).toHaveBeenCalledWith(
            user,
            LogAction.PRODUCT_UPDATED,
            expect.objectContaining({ productId: 1 }),
        );
        expect(cache.del).toHaveBeenCalledWith('products:all');
        expect(cache.del).toHaveBeenCalledWith('products:1');
    });

    it('removes a product', async () => {
        const deleteSpy = jest.spyOn(repo, 'delete');
        const logSpy = jest.spyOn(logService, 'logAction');
        const user = { id: 1 } as User;
        cache.del.mockClear();
        await service.remove(1, user);
        expect(deleteSpy).toHaveBeenCalledWith(1);
        expect(logSpy).toHaveBeenCalledWith(
            user,
            LogAction.PRODUCT_DELETED,
            expect.objectContaining({ productId: 1 }),
        );
        expect(cache.del).toHaveBeenCalledWith('products:all');
        expect(cache.del).toHaveBeenCalledWith('products:1');
    });

    describe('when logging fails', () => {
        it('allows creation to succeed', async () => {
            const logActionSpy = jest
                .spyOn(logService, 'logAction')
                .mockRejectedValue(new Error('fail'));
            const consoleSpy = jest
                .spyOn(console, 'error')
                .mockImplementation(() => {});
            const dto: Partial<Product> = {
                name: 'Shampoo',
                brand: 'Brand',
                unitPrice: 5,
                stock: 10,
            };
            const user = { id: 1 } as User;
            cache.del.mockClear();
            await expect(service.create(dto as Product, user)).resolves.toEqual(
                {
                    id: 1,
                    ...dto,
                },
            );
            expect(consoleSpy).toHaveBeenCalled();
            expect(cache.del).toHaveBeenCalledWith('products:all');
            expect(cache.del).toHaveBeenCalledWith('products:1');
            consoleSpy.mockRestore();
            logActionSpy.mockRestore();
        });

        it('allows update to succeed', async () => {
            const logActionSpy = jest
                .spyOn(logService, 'logAction')
                .mockRejectedValue(new Error('fail'));
            const consoleSpy = jest
                .spyOn(console, 'error')
                .mockImplementation(() => {});
            const user = { id: 1 } as User;
            cache.del.mockClear();
            await expect(service.update(1, {}, user)).resolves.toEqual({
                id: 1,
            });
            expect(consoleSpy).toHaveBeenCalled();
            expect(cache.del).toHaveBeenCalledWith('products:all');
            expect(cache.del).toHaveBeenCalledWith('products:1');
            consoleSpy.mockRestore();
            logActionSpy.mockRestore();
        });

        it('allows removal to succeed', async () => {
            const logActionSpy = jest
                .spyOn(logService, 'logAction')
                .mockRejectedValue(new Error('fail'));
            const consoleSpy = jest
                .spyOn(console, 'error')
                .mockImplementation(() => {});
            const user = { id: 1 } as User;
            cache.del.mockClear();
            await expect(service.remove(1, user)).resolves.toBeUndefined();
            expect(consoleSpy).toHaveBeenCalled();
            expect(cache.del).toHaveBeenCalledWith('products:all');
            expect(cache.del).toHaveBeenCalledWith('products:1');
            consoleSpy.mockRestore();
            logActionSpy.mockRestore();
        });
    });
});
