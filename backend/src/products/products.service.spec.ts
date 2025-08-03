import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProductsService } from './products.service';
import { Product } from '../catalog/product.entity';
import { Sale } from '../sales/sale.entity';
import { LogsService } from '../logs/logs.service';
import { LogAction } from '../logs/action.enum';
import {
    BadRequestException,
    ConflictException,
    NotFoundException,
} from '@nestjs/common';
import { ProductUsageService } from '../product-usage/product-usage.service';
import { UsageType } from '../product-usage/usage-type.enum';
import { ProductUsage } from '../product-usage/product-usage.entity';

describe('ProductsService', () => {
    let service: ProductsService;
    const repo = {
        create: jest.fn(),
        save: jest.fn(),
        findOne: jest.fn(),
        find: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        createQueryBuilder: jest.fn(),
        manager: { transaction: jest.fn() },
    } as any;
    const sales = { count: jest.fn() } as any;
    const usageRepo = { count: jest.fn() } as any;
    const logs = { create: jest.fn() } as any;
    const usage = { createStockCorrection: jest.fn() } as any;

    beforeEach(async () => {
        repo.create.mockReset();
        repo.save.mockReset();
        repo.findOne.mockReset();
        repo.find.mockReset();
        repo.update.mockReset();
        repo.delete.mockReset();
        repo.createQueryBuilder.mockReset();
        repo.manager.transaction.mockReset();
        sales.count.mockReset();
        usageRepo.count.mockReset();
        logs.create.mockReset();
        usage.createStockCorrection.mockReset();
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ProductsService,
                { provide: getRepositoryToken(Product), useValue: repo },
                { provide: getRepositoryToken(Sale), useValue: sales },
                { provide: getRepositoryToken(ProductUsage), useValue: usageRepo },
                { provide: LogsService, useValue: logs },
                { provide: ProductUsageService, useValue: usage },
            ],
        }).compile();
        service = module.get(ProductsService);
    });

    it('creates product and logs', async () => {
        repo.create.mockImplementation((d: any) => d);
        repo.save.mockImplementation((d: any) => ({ id: 1, ...d }));
        const dto = { name: 'n', unitPrice: 5, stock: 2 };
        const result = await service.create(dto as any);
        expect(result.id).toBe(1);
        expect(logs.create).toHaveBeenCalledWith(
            LogAction.CreateProduct,
            JSON.stringify({ id: 1, ...dto }),
        );
    });

    it('updates product and logs', async () => {
        repo.findOne.mockResolvedValue({ id: 1 });
        repo.save.mockImplementation((d: any) => d);
        const res = await service.update(1, { name: 'b' } as any);
        expect(res).toBeDefined();
        expect(logs.create).toHaveBeenCalledWith(
            LogAction.UpdateProduct,
            JSON.stringify({ id: 1, name: 'b' }),
        );
    });

    it('adjusts stock and logs', async () => {
        repo.findOne.mockResolvedValue({ id: 1, stock: 2 });
        repo.save.mockImplementation((d: any) => d);
        const res = await service.updateStock(1, -1);
        expect(res!.stock).toBe(1);
        expect(logs.create).toHaveBeenCalledWith(
            LogAction.UpdateProductStock,
            JSON.stringify({
                id: 1,
                amount: -1,
                stock: 1,
                usageType: UsageType.STOCK_CORRECTION,
            }),
        );
    });

    it('deletes product when no sales', async () => {
        repo.findOne.mockResolvedValue({ id: 1 });
        usageRepo.count.mockResolvedValue(0);
        sales.count.mockResolvedValue(0);
        repo.delete.mockResolvedValue({ affected: 1 });
        const res = await service.remove(1);
        expect(res).toEqual({ affected: 1 });
        expect(logs.create).toHaveBeenCalledWith(
            LogAction.DeleteProduct,
            JSON.stringify({ id: 1 }),
        );
    });

    it('lists all products', async () => {
        repo.find.mockResolvedValue([{ id: 1 }]);
        const res = await service.findAll();
        expect(repo.find).toHaveBeenCalled();
        expect(res).toEqual([{ id: 1 }]);
    });

    it('finds product by id', async () => {
        repo.findOne.mockResolvedValue({ id: 2 });
        const res = await service.findOne(2);
        expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 2 } });
        expect(res).toEqual({ id: 2 });
    });

    it('returns undefined when product missing', async () => {
        repo.findOne.mockResolvedValue(undefined);
        const res = await service.findOne(99);
        expect(res).toBeUndefined();
    });

    it('finds low stock products', async () => {
        const qb = {
            where: jest.fn().mockReturnThis(),
            getMany: jest.fn().mockResolvedValue(['p']),
        };
        repo.createQueryBuilder.mockReturnValue(qb);
        const res = await service.findLowStock();
        expect(repo.createQueryBuilder).toHaveBeenCalledWith('p');
        expect(qb.where).toHaveBeenCalledWith('p.stock < p.lowStockThreshold');
        expect(res).toEqual(['p']);
    });

    it('bulk updates stock for multiple products', async () => {
        const manager = { findOne: jest.fn(), save: jest.fn() } as any;
        repo.manager.transaction.mockImplementation(async (cb: any) =>
            cb(manager),
        );
        manager.findOne
            .mockResolvedValueOnce({ id: 1, stock: 1 })
            .mockResolvedValueOnce({ id: 2, stock: 2 });
        manager.save.mockImplementation((_: any, p: any) => p);

        const res = await service.bulkUpdateStock(
            [
                { id: 1, stock: 5 },
                { id: 2, stock: 3 },
            ],
            1,
        );

        expect(res).toHaveLength(2);
        expect(manager.save).toHaveBeenCalledTimes(2);
        expect(logs.create).toHaveBeenNthCalledWith(
            1,
            LogAction.BulkUpdateProductStock,
            JSON.stringify({
                id: 1,
                stock: 5,
                usageType: UsageType.STOCK_CORRECTION,
            }),
        );
        expect(logs.create).toHaveBeenNthCalledWith(
            2,
            LogAction.BulkUpdateProductStock,
            JSON.stringify({
                id: 2,
                stock: 3,
                usageType: UsageType.STOCK_CORRECTION,
            }),
        );
        expect(usage.createStockCorrection).not.toHaveBeenCalled();
    });

    it('records usage when stock decreases', async () => {
        const manager = { findOne: jest.fn(), save: jest.fn() } as any;
        repo.manager.transaction.mockImplementation(async (cb: any) =>
            cb(manager),
        );
        manager.findOne.mockResolvedValue({ id: 1, stock: 5 });
        manager.save.mockImplementation((_: any, p: any) => p);

        const res = await service.bulkUpdateStock([{ id: 1, stock: 3 }], 2);

        expect(res).toHaveLength(1);
        expect(usage.createStockCorrection).toHaveBeenCalledWith(
            manager,
            1,
            2,
            3,
            2,
        );
        expect(logs.create).toHaveBeenCalledWith(
            LogAction.BulkUpdateProductStock,
            JSON.stringify({
                id: 1,
                stock: 3,
                usageType: UsageType.STOCK_CORRECTION,
            }),
        );
    });

    it('fails bulk update on negative stock', async () => {
        const manager = { findOne: jest.fn(), save: jest.fn() } as any;
        repo.manager.transaction.mockImplementation(async (cb: any) =>
            cb(manager),
        );
        manager.findOne.mockResolvedValue({ id: 1, stock: 1 });

        await expect(
            service.bulkUpdateStock([{ id: 1, stock: -1 }], 1),
        ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('fails bulk update when product missing', async () => {
        const manager = { findOne: jest.fn(), save: jest.fn() } as any;
        repo.manager.transaction.mockImplementation(async (cb: any) =>
            cb(manager),
        );
        manager.findOne.mockResolvedValue(undefined);

        await expect(
            service.bulkUpdateStock([{ id: 99, stock: 1 }], 1),
        ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws when stock goes negative', async () => {
        repo.findOne.mockResolvedValue({ id: 1, stock: 1 });
        await expect(service.updateStock(1, -2)).rejects.toBeInstanceOf(
            BadRequestException,
        );
    });

    it('throws NotFound when deleting missing product', async () => {
        repo.findOne.mockResolvedValue(undefined);
        await expect(service.remove(1)).rejects.toBeInstanceOf(
            NotFoundException,
        );
    });

    it('throws Conflict when deleting with sales', async () => {
        repo.findOne.mockResolvedValue({ id: 1 });
        usageRepo.count.mockResolvedValue(0);
        sales.count.mockResolvedValue(1);
        await expect(service.remove(1)).rejects.toBeInstanceOf(
            ConflictException,
        );
    });

    it('throws Conflict when deleting with usage records', async () => {
        repo.findOne.mockResolvedValue({ id: 1 });
        usageRepo.count.mockResolvedValue(1);
        await expect(service.remove(1)).rejects.toBeInstanceOf(
            ConflictException,
        );
        expect(repo.delete).not.toHaveBeenCalled();
    });
});
