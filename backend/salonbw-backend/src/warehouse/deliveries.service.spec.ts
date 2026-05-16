import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository, EntityManager } from 'typeorm';
import { DeliveriesService } from './deliveries.service';
import { Delivery, DeliveryStatus } from './entities/delivery.entity';
import { DeliveryItem } from './entities/delivery-item.entity';
import { Product } from '../products/product.entity';
import { ProductMovement } from './entities/product-movement.entity';
import { LogService } from '../logs/log.service';
import { User } from '../users/user.entity';
import { BadRequestException } from '@nestjs/common';

describe('DeliveriesService', () => {
    let service: DeliveriesService;
    let deliveryRepo: jest.Mocked<Repository<Delivery>>;
    let productRepo: jest.Mocked<Repository<Product>>;
    let dataSource: jest.Mocked<DataSource>;
    let logService: jest.Mocked<LogService>;

    const mockManager = {
        findOne: jest.fn(),
        find: jest.fn(),
        save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
        create: jest.fn().mockImplementation((cls, data) => data),
    } as unknown as jest.Mocked<EntityManager>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DeliveriesService,
                {
                    provide: getRepositoryToken(Delivery),
                    useValue: {
                        findOne: jest.fn(),
                        create: jest.fn(),
                        save: jest.fn(),
                        update: jest.fn(),
                        createQueryBuilder: jest.fn(),
                    },
                },
                {
                    provide: getRepositoryToken(DeliveryItem),
                    useValue: {},
                },
                {
                    provide: getRepositoryToken(Product),
                    useValue: {
                        findOne: jest.fn(),
                    },
                },
                {
                    provide: getRepositoryToken(ProductMovement),
                    useValue: {},
                },
                {
                    provide: DataSource,
                    useValue: {
                        transaction: jest.fn().mockImplementation((cb) => cb(mockManager)),
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

        service = module.get<DeliveriesService>(DeliveriesService);
        deliveryRepo = module.get(getRepositoryToken(Delivery));
        productRepo = module.get(getRepositoryToken(Product));
        dataSource = module.get(DataSource);
        logService = module.get(LogService);

        jest.clearAllMocks();
    });

    describe('receive', () => {
        it('should update product stocks and create movements (reproduction of N+1)', async () => {
            const deliveryId = 1;
            const actor = { id: 10 } as User;
            const dto = { notes: 'Updated notes' };

            const delivery = {
                id: deliveryId,
                deliveryNumber: 'D20230500001',
                status: DeliveryStatus.Draft,
                items: [
                    { productId: 1, quantity: 5 },
                    { productId: 2, quantity: 10 },
                    { productId: 3, quantity: 15 },
                ],
            } as Delivery;

            deliveryRepo.findOne.mockResolvedValue(delivery);

            mockManager.findOne.mockImplementation((entityCls, options) => {
                if (entityCls === Product) {
                    const id = (options as any).where.id;
                    return Promise.resolve({ id, stock: 100 } as Product);
                }
                return Promise.resolve(null);
            });

            mockManager.find.mockResolvedValue([
                { id: 1, stock: 100 } as Product,
                { id: 2, stock: 100 } as Product,
                { id: 3, stock: 100 } as Product,
            ]);

            await service.receive(deliveryId, dto, actor);

            // VERIFY Optimized: find should be called once, findOne should not be called for Products
            expect(mockManager.find).toHaveBeenCalledTimes(1);
            expect(mockManager.find).toHaveBeenCalledWith(Product, expect.objectContaining({
                where: { id: expect.anything() }
            }));
            expect(mockManager.findOne).not.toHaveBeenCalled();

            expect(mockManager.save).toHaveBeenCalledWith(expect.objectContaining({ id: 1, stock: 105 }));
            expect(mockManager.save).toHaveBeenCalledWith(expect.objectContaining({ id: 2, stock: 110 }));
            expect(mockManager.save).toHaveBeenCalledWith(expect.objectContaining({ id: 3, stock: 115 }));

            expect(delivery.status).toBe(DeliveryStatus.Received);
        });

        it('should throw BadRequestException if delivery is already received', async () => {
            const deliveryId = 1;
            const delivery = {
                id: deliveryId,
                status: DeliveryStatus.Received,
            } as Delivery;

            deliveryRepo.findOne.mockResolvedValue(delivery);

            await expect(service.receive(deliveryId, {}, {} as User)).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException if delivery has no items', async () => {
            const deliveryId = 1;
            const delivery = {
                id: deliveryId,
                status: DeliveryStatus.Draft,
                items: [],
            } as Delivery;

            deliveryRepo.findOne.mockResolvedValue(delivery);

            await expect(service.receive(deliveryId, {}, {} as User)).rejects.toThrow(BadRequestException);
        });
    });
});
