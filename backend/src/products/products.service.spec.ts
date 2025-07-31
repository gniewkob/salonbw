import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProductsService } from './products.service';
import { Product } from '../catalog/product.entity';
import { Sale } from '../sales/sale.entity';
import { LogsService } from '../logs/logs.service';
import { LogAction } from '../logs/action.enum';

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
    } as any;
    const sales = { count: jest.fn() } as any;
    const logs = { create: jest.fn() } as any;

    beforeEach(async () => {
        repo.create.mockReset();
        repo.save.mockReset();
        repo.findOne.mockReset();
        repo.find.mockReset();
        repo.update.mockReset();
        repo.delete.mockReset();
        repo.createQueryBuilder.mockReset();
        sales.count.mockReset();
        logs.create.mockReset();
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ProductsService,
                { provide: getRepositoryToken(Product), useValue: repo },
                { provide: getRepositoryToken(Sale), useValue: sales },
                { provide: LogsService, useValue: logs },
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
            JSON.stringify({ id: 1, amount: -1, stock: 1 }),
        );
    });

    it('deletes product when no sales', async () => {
        repo.findOne.mockResolvedValue({ id: 1 });
        sales.count.mockResolvedValue(0);
        repo.delete.mockResolvedValue({ affected: 1 });
        const res = await service.remove(1);
        expect(res).toEqual({ affected: 1 });
        expect(logs.create).toHaveBeenCalledWith(
            LogAction.DeleteProduct,
            JSON.stringify({ id: 1 }),
        );
    });
});
