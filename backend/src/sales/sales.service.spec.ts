import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SalesService } from './sales.service';
import { Sale } from './sale.entity';
import { Product } from '../catalog/product.entity';
import { CommissionRecord } from '../commissions/commission-record.entity';
import { CommissionsService } from '../commissions/commissions.service';
import { ProductUsageService } from '../product-usage/product-usage.service';

describe('SalesService', () => {
    let service: SalesService;
    const repo = { create: jest.fn(), save: jest.fn() } as any;
    const products = { findOne: jest.fn(), save: jest.fn() } as any;
    const commissions = { create: jest.fn(), save: jest.fn() } as any;
    const commissionService = { getPercentForProduct: jest.fn() } as any;
    const usage = { createSale: jest.fn() } as any;

    beforeEach(async () => {
        repo.create.mockReset();
        repo.save.mockReset();
        products.findOne.mockReset();
        products.save.mockReset();
        commissions.create.mockReset();
        commissions.save.mockReset();
        commissionService.getPercentForProduct.mockReset();
        usage.createSale.mockReset();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SalesService,
                { provide: getRepositoryToken(Sale), useValue: repo },
                { provide: getRepositoryToken(Product), useValue: products },
                {
                    provide: getRepositoryToken(CommissionRecord),
                    useValue: commissions,
                },
                { provide: CommissionsService, useValue: commissionService },
                { provide: ProductUsageService, useValue: usage },
            ],
        }).compile();

        service = module.get(SalesService);
    });

    it('creates sale and records product usage', async () => {
        products.findOne.mockResolvedValue({
            id: 1,
            stock: 5,
            unitPrice: 10,
        });
        repo.create.mockImplementation((d: any) => d);
        repo.save.mockImplementation((d: any) => ({ id: 1, ...d }));
        commissionService.getPercentForProduct.mockResolvedValue(0);

        const sale = await service.create(1, 2, 1, 2);

        expect(sale.id).toBe(1);
        expect(products.save).toHaveBeenCalledWith({
            id: 1,
            stock: 3,
            unitPrice: 10,
        });
        expect(usage.createSale).toHaveBeenCalledWith(1, 2, 3, 2);
    });
});

