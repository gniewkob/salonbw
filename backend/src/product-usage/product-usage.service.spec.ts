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

describe('ProductUsageService', () => {
    let service: ProductUsageService;
    const repo = { manager: { transaction: jest.fn() } } as any;
    const products = { findOne: jest.fn(), save: jest.fn() } as any;
    const logs = { create: jest.fn() } as any;

    beforeEach(async () => {
        repo.manager.transaction.mockReset();
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
            { productId: 1, quantity: 1 },
        ]);
        expect(res).toHaveLength(1);
        expect(manager.save).toHaveBeenCalledTimes(2);
        expect(logs.create).toHaveBeenCalledWith(
            LogAction.ProductUsed,
            expect.any(String),
            2,
        );
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
            service.registerUsage(1, 2, [{ productId: 1, quantity: 1 }]),
        ).rejects.toBeInstanceOf(ConflictException);
    });

    it('throws on negative quantity', async () => {
        const manager = { findOne: jest.fn(), save: jest.fn() } as any;
        repo.manager.transaction.mockImplementation(async (cb: any) =>
            cb(manager),
        );
        await expect(
            service.registerUsage(1, 2, [{ productId: 1, quantity: 0 }]),
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
            service.registerUsage(1, 2, [{ productId: 1, quantity: 1 }]),
        ).rejects.toBeInstanceOf(NotFoundException);
    });
});
