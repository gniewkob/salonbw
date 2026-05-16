import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository, EntityManager, In } from 'typeorm';
import { StocktakingService } from './stocktaking.service';
import { Stocktaking, StocktakingStatus } from './entities/stocktaking.entity';
import { StocktakingItem } from './entities/stocktaking-item.entity';
import { Product } from '../products/product.entity';
import { ProductMovement } from './entities/product-movement.entity';
import { LogService } from '../logs/log.service';
import { User } from '../users/user.entity';

describe('StocktakingService', () => {
    let service: StocktakingService;
    let stocktakingRepo: Repository<Stocktaking>;
    let dataSource: DataSource;

    const mockUser = { id: 1 } as User;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                StocktakingService,
                {
                    provide: getRepositoryToken(Stocktaking),
                    useValue: {
                        findOne: jest.fn(),
                        save: jest.fn(),
                    },
                },
                {
                    provide: getRepositoryToken(StocktakingItem),
                    useValue: {
                        save: jest.fn(),
                        create: jest.fn(),
                    },
                },
                {
                    provide: getRepositoryToken(Product),
                    useValue: {
                        find: jest.fn(),
                        findOne: jest.fn(),
                    },
                },
                {
                    provide: getRepositoryToken(ProductMovement),
                    useValue: {
                        save: jest.fn(),
                        create: jest.fn(),
                    },
                },
                {
                    provide: DataSource,
                    useValue: {
                        transaction: jest.fn(),
                    },
                },
                {
                    provide: LogService,
                    useValue: {
                        logAction: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<StocktakingService>(StocktakingService);
        stocktakingRepo = module.get<Repository<Stocktaking>>(getRepositoryToken(Stocktaking));
        dataSource = module.get<DataSource>(DataSource);
    });

    describe('complete (N+1 check)', () => {
        it('should complete stocktaking and apply differences in a single query', async () => {
            const stocktakingId = 1;
            const items = [
                { productId: 101, systemQuantity: 10, countedQuantity: 12, difference: 2 },
                { productId: 102, systemQuantity: 5, countedQuantity: 5, difference: 0 },
                { productId: 103, systemQuantity: 8, countedQuantity: 7, difference: -1 },
            ] as StocktakingItem[];

            const stocktaking = {
                id: stocktakingId,
                status: StocktakingStatus.InProgress,
                items,
                stocktakingNumber: 'ST001',
            } as Stocktaking;

            jest.spyOn(stocktakingRepo, 'findOne').mockResolvedValue(stocktaking);

            const mockManager = {
                findOne: jest.fn(),
                find: jest.fn().mockImplementation((entity, options) => {
                    if (entity === Product) {
                         const ids = options.where.id._value; // simplified access for test
                         return Promise.resolve(ids.map((id: number) => ({ id, stock: items.find(i => i.productId === id)?.systemQuantity })));
                    }
                    return Promise.resolve([]);
                }),
                save: jest.fn().mockResolvedValue({}),
                create: jest.fn().mockImplementation((entity, data) => data),
            } as unknown as EntityManager;

            (dataSource.transaction as jest.Mock).mockImplementation(async (cb) => {
                return await cb(mockManager);
            });

            await service.complete(stocktakingId, { applyDifferences: true }, mockUser);

            // Expect ONE call to manager.find for Products with differences
            const productFindCalls = (mockManager.find as jest.Mock).mock.calls.filter(call => call[0] === Product);
            expect(productFindCalls.length).toBe(1);

            // Expect NO calls to manager.findOne for Products
            const productFindOneCalls = (mockManager.findOne as jest.Mock).mock.calls.filter(call => call[0] === Product);
            expect(productFindOneCalls.length).toBe(0);

            expect(mockManager.save).toHaveBeenCalledWith(expect.objectContaining({ id: 101, stock: 12 }));
            expect(mockManager.save).toHaveBeenCalledWith(expect.objectContaining({ id: 103, stock: 7 }));
        });
    });
});
