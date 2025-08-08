import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SalesService } from './sales.service';
import { Sale } from './sale.entity';
import { Product } from '../catalog/product.entity';
import { Appointment } from '../appointments/appointment.entity';
import { CommissionsService } from '../commissions/commissions.service';
import { ProductUsageService } from '../product-usage/product-usage.service';

describe('SalesService', () => {
    let service: SalesService;
    const repo = { manager: { transaction: jest.fn() } } as any;
    const commissionService = { getPercentForProduct: jest.fn() } as any;
    const usage = { createSale: jest.fn() } as any;

    beforeEach(async () => {
        repo.manager.transaction.mockReset();
        commissionService.getPercentForProduct.mockReset();
        usage.createSale.mockReset();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SalesService,
                { provide: getRepositoryToken(Sale), useValue: repo },
                { provide: CommissionsService, useValue: commissionService },
                { provide: ProductUsageService, useValue: usage },
            ],
        }).compile();

        service = module.get(SalesService);
    });

    it('creates sale and records product usage', async () => {
        const manager = {
            findOne: jest
                .fn()
                .mockResolvedValue({ id: 1, stock: 5, unitPrice: 10 }),
            save: jest.fn().mockImplementation((entity: any, d: any) => {
                if (entity === Sale) {
                    return { id: 1, ...d };
                }
                return { ...d };
            }),
            create: jest.fn((_: any, d: any) => d),
            getRepository: jest.fn().mockReturnValue({
                findOneOrFail: jest.fn().mockResolvedValue({ id: 3 }),
            }),
        } as any;
        repo.manager.transaction.mockImplementation(async (cb: any) =>
            cb(manager),
        );
        commissionService.getPercentForProduct.mockResolvedValue(0);

        const sale = await service.create(1, 2, 1, 2, 3);

        expect(manager.findOne).toHaveBeenCalledWith(Product, {
            where: { id: 1 },
            lock: { mode: 'pessimistic_write' },
        });
        expect(manager.save).toHaveBeenCalledWith(Product, {
            id: 1,
            stock: 3,
            unitPrice: 10,
        });
        expect(usage.createSale).toHaveBeenCalledWith(
            manager,
            1,
            2,
            3,
            2,
            3,
        );
        expect(manager.getRepository).toHaveBeenCalledWith(Appointment);
        expect(sale.id).toBe(1);
    });

    it('throws if appointment does not exist', async () => {
        const manager = {
            getRepository: jest.fn().mockReturnValue({
                findOneOrFail: jest.fn().mockRejectedValue(new Error()),
            }),
        } as any;
        repo.manager.transaction.mockImplementation(async (cb: any) =>
            cb(manager),
        );

        await expect(service.create(1, 2, 1, 2, 3)).rejects.toThrow(
            BadRequestException,
        );
        expect(manager.getRepository).toHaveBeenCalledWith(Appointment);
    });
});

