import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductsService } from './products.service';
import { Product } from './product.entity';
import { NotFoundException } from '@nestjs/common';
import { LogService } from '../logs/log.service';

describe('ProductsService', () => {
    let service: ProductsService;
    let repo: jest.Mocked<Repository<Product>>;

    const mockRepository = (): jest.Mocked<Repository<Product>> =>
        ({
            create: jest.fn<Product, [Partial<Product>]>(
                (dto) => dto as Product,
            ),
            save: jest.fn<Promise<Product>, [Product]>((entity) =>
                Promise.resolve({ id: 1, ...entity } as Product),
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
        }) as jest.Mocked<Repository<Product>>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ProductsService,
                {
                    provide: getRepositoryToken(Product),
                    useValue: mockRepository(),
                },
                {
                    provide: LogService,
                    useValue: { logAction: jest.fn() },
                },
            ],
        }).compile();

        service = module.get<ProductsService>(ProductsService);
        repo = module.get<jest.Mocked<Repository<Product>>>(
            getRepositoryToken(Product),
        );
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
        await expect(service.create(dto as Product)).resolves.toEqual({
            id: 1,
            ...dto,
        });
        expect(createSpy).toHaveBeenCalledWith(dto);
        expect(saveSpy).toHaveBeenCalled();
    });

    it('returns all products', async () => {
        const findSpy = jest.spyOn(repo, 'find');
        await expect(service.findAll()).resolves.toEqual([{ id: 1 }]);
        expect(findSpy).toHaveBeenCalled();
    });

    it('returns a product by id', async () => {
        const findOneSpy = jest.spyOn(repo, 'findOne');
        await expect(service.findOne(1)).resolves.toEqual({ id: 1 });
        expect(findOneSpy).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('throws when product not found', async () => {
        const findOneSpy = jest.spyOn(repo, 'findOne').mockResolvedValue(null);
        await expect(service.findOne(2)).rejects.toBeInstanceOf(
            NotFoundException,
        );
        expect(findOneSpy).toHaveBeenCalledWith({ where: { id: 2 } });
    });

    it('updates a product', async () => {
        const dto: Partial<Product> = { name: 'New' };
        const updateSpy = jest.spyOn(repo, 'update');
        await expect(service.update(1, dto as Product)).resolves.toEqual({
            id: 1,
        });
        expect(updateSpy).toHaveBeenCalledWith(1, dto);
    });

    it('removes a product', async () => {
        const deleteSpy = jest.spyOn(repo, 'delete');
        await service.remove(1);
        expect(deleteSpy).toHaveBeenCalledWith(1);
    });
});
