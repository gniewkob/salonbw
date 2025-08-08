import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProductUsageService } from './product-usage.service';
import { ProductUsage } from './product-usage.entity';
import { Product } from '../catalog/product.entity';
import { LogsService } from '../logs/logs.service';
import { LogAction } from '../logs/action.enum';
import {
    BadRequestException,
    ConflictException,
    NotFoundException,
} from '@nestjs/common';
import { UsageType } from './usage-type.enum';

describe('ProductUsageService', () => {
    let service: ProductUsageService;
    const repo = {
        manager: { transaction: jest.fn() },
        find: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
    } as any;
    const products = { findOne: jest.fn(), save: jest.fn() } as any;
    const logs = { create: jest.fn() } as any;

    beforeEach(async () => {
        repo.manager.transaction.mockReset();
        repo.find.mockReset();
        repo.create.mockReset();
        repo.save.mockReset();
        products.findOne.mockReset();
        products.save.mockReset();
        logs.create.mockReset();
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ProductUsageService,
                { provide: getRepositoryToken(ProductUsage), useValue: repo },
                { provide: getRepositoryToken(Product), useValue: products },
                { provide: LogsService, useValue: logs },
            ],
        }).compile();
        service = module.get(ProductUsageService);
    });

    it('registers usage and decrements stock', async () => {
        const manager = {
            findOne: jest.fn().mockResolvedValue({ id: 1, stock: 2 }),
            save: jest.fn().mockImplementation((_: any, d: any) => d),
            create: jest.fn((_: any, d: any) => d),
        } as any;
        repo.manager.transaction.mockImplementation(async (cb: any) =>
            cb(manager),
        );

        const res = await service.registerUsage(1, 2, [
            { productId: 1, quantity: 1, usageType: UsageType.INTERNAL },
        ]);
        expect(res).toHaveLength(1);
        expect(manager.save).toHaveBeenCalledTimes(2);
        expect(manager.create).toHaveBeenCalledWith(
            ProductUsage,
            expect.objectContaining({ usageType: UsageType.INTERNAL }),
        );
        expect(manager.save).toHaveBeenCalledWith(
            ProductUsage,
            expect.objectContaining({ usageType: UsageType.INTERNAL }),
        );
        expect(res[0].usageType).toBe(UsageType.INTERNAL);
        expect(logs.create).toHaveBeenCalledWith(
            LogAction.ProductUsed,
            expect.any(String),
            2,
        );
        const payload = JSON.parse(logs.create.mock.calls[0][1]);
        expect(payload.usageType).toBe(UsageType.INTERNAL);
    });

    it('throws on insufficient stock', async () => {
        const manager = {
            findOne: jest.fn().mockResolvedValue({ id: 1, stock: 0 }),
            save: jest.fn(),
        } as any;
        repo.manager.transaction.mockImplementation(async (cb: any) =>
            cb(manager),
        );
        await expect(
            service.registerUsage(1, 2, [
                { productId: 1, quantity: 1, usageType: UsageType.INTERNAL },
            ]),
        ).rejects.toBeInstanceOf(ConflictException);
    });

    it('throws on negative quantity', async () => {
        const manager = { findOne: jest.fn(), save: jest.fn() } as any;
        repo.manager.transaction.mockImplementation(async (cb: any) =>
            cb(manager),
        );
        await expect(
            service.registerUsage(1, 2, [
                { productId: 1, quantity: 0, usageType: UsageType.INTERNAL },
            ]),
        ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws when product not found', async () => {
        const manager = {
            findOne: jest.fn().mockResolvedValue(undefined),
            save: jest.fn(),
        } as any;
        repo.manager.transaction.mockImplementation(async (cb: any) =>
            cb(manager),
        );
        await expect(
            service.registerUsage(1, 2, [
                { productId: 1, quantity: 1, usageType: UsageType.INTERNAL },
            ]),
        ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects sale entries', async () => {
        const manager = { findOne: jest.fn(), save: jest.fn() } as any;
        repo.manager.transaction.mockImplementation(async (cb: any) =>
            cb(manager),
        );
        await expect(
            service.registerUsage(1, 2, [
                { productId: 1, quantity: 1, usageType: UsageType.SALE },
            ]),
        ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('prevents concurrent stock modifications', async () => {
        const product = { id: 1, stock: 1 };
        const manager = {
            findOne: jest.fn().mockResolvedValue(product),
            save: jest.fn().mockImplementation((_: any, d: any) => d),
            create: jest.fn((_: any, d: any) => d),
        } as any;
        const queue: (() => void)[] = [];
        let locked = false;
        repo.manager.transaction.mockImplementation(async (cb: any) => {
            if (locked) {
                await new Promise<void>((resolve) => queue.push(resolve));
            }
            locked = true;
            try {
                return await cb(manager);
            } finally {
                locked = false;
                queue.shift()?.();
            }
        });

        const firstCall = service.registerUsage(1, 2, [
            { productId: 1, quantity: 1, usageType: UsageType.INTERNAL },
        ]);
        const secondCall = service.registerUsage(1, 2, [
            { productId: 1, quantity: 1, usageType: UsageType.INTERNAL },
        ]);
        const secondExpectation = expect(secondCall).rejects.toBeInstanceOf(
            ConflictException,
        );

        await expect(firstCall).resolves.toHaveLength(1);
        await secondExpectation;
        expect(manager.save).toHaveBeenCalledTimes(2);
        expect(logs.create).toHaveBeenCalledTimes(1);
    });

    it('filters by usage type when provided', async () => {
        repo.find.mockResolvedValue([]);
        await service.findForProduct(1, UsageType.SALE);
        expect(repo.find).toHaveBeenCalledWith({
            where: { product: { id: 1 }, usageType: UsageType.SALE },
            order: { timestamp: 'DESC' },
        });
    });

    it('creates sale usage linked to appointment when provided', async () => {
        const manager = {
            create: jest.fn((_: any, d: any) => d),
            save: jest.fn(async (_: any, d: any) => d),
        } as any;
        const res = await service.createSale(manager, 1, 2, 3, 4, 5);
        expect(manager.create).toHaveBeenCalledWith(
            ProductUsage,
            expect.objectContaining({
                appointment: { id: 5 },
                product: { id: 1 },
                quantity: 2,
                usageType: UsageType.SALE,
                usedByEmployee: { id: 4 },
            }),
        );
        expect(manager.save).toHaveBeenCalledWith(
            ProductUsage,
            expect.objectContaining({ usageType: UsageType.SALE }),
        );
        expect(res.appointment).toEqual({ id: 5 });
        expect(logs.create).toHaveBeenCalledWith(
            LogAction.ProductUsed,
            expect.stringContaining('"appointmentId":5'),
            4,
        );
    });
});
