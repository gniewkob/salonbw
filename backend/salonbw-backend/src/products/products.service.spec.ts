import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductsService } from './products.service';
import { Product } from './product.entity';
import { NotFoundException } from '@nestjs/common';

describe('ProductsService', () => {
  let service: ProductsService;
  let repo: jest.Mocked<Repository<Product>>;

  const mockRepository = () => ({
    create: jest.fn((dto: Partial<Product>) => dto as Product),
    save: jest.fn((entity: Product) =>
      Promise.resolve({ id: 1, ...entity } as Product),
    ),
    find: jest.fn(() => Promise.resolve([{ id: 1 } as Product])),
    findOne: jest.fn(() => Promise.resolve({ id: 1 } as Product)),
    update: jest.fn(() => Promise.resolve(undefined)),
    delete: jest.fn(() => Promise.resolve(undefined)),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: getRepositoryToken(Product), useValue: mockRepository() },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    repo = module.get(getRepositoryToken(Product));
  });

  it('creates a product', async () => {
    const dto: Partial<Product> = {
      name: 'Shampoo',
      brand: 'Brand',
      unitPrice: 5,
      stock: 10,
    };
    await expect(service.create(dto as Product)).resolves.toEqual({ id: 1, ...dto });
    expect(repo.create).toHaveBeenCalledWith(dto);
    expect(repo.save).toHaveBeenCalled();
  });

  it('returns all products', async () => {
    await expect(service.findAll()).resolves.toEqual([{ id: 1 }]);
    expect(repo.find).toHaveBeenCalled();
  });

  it('returns a product by id', async () => {
    await expect(service.findOne(1)).resolves.toEqual({ id: 1 });
    expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  it('throws when product not found', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.findOne(2)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates a product', async () => {
    const dto: Partial<Product> = { name: 'New' };
    await expect(service.update(1, dto as Product)).resolves.toEqual({ id: 1 });
    expect(repo.update).toHaveBeenCalledWith(1, dto);
  });

  it('removes a product', async () => {
    await service.remove(1);
    expect(repo.delete).toHaveBeenCalledWith(1);
  });
});

