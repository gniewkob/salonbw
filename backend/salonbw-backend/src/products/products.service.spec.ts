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
    const { create: repoCreate, save } = repo;
    const { create } = service;
    const dto: Partial<Product> = {
      name: 'Shampoo',
      brand: 'Brand',
      unitPrice: 5,
      stock: 10,
    };
    await expect(create.call(service, dto as Product)).resolves.toEqual({
      id: 1,
      ...dto,
    });
    expect(repoCreate).toHaveBeenCalledWith(dto);
    expect(save).toHaveBeenCalled();
  });

  it('returns all products', async () => {
    const { find } = repo;
    const { findAll } = service;
    await expect(findAll.call(service)).resolves.toEqual([{ id: 1 }]);
    expect(find).toHaveBeenCalled();
  });

  it('returns a product by id', async () => {
    const { findOne: repoFindOne } = repo;
    const { findOne } = service;
    await expect(findOne.call(service, 1)).resolves.toEqual({ id: 1 });
    expect(repoFindOne).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  it('throws when product not found', async () => {
    const { findOne: repoFindOne } = repo;
    const { findOne } = service;
    repoFindOne.mockResolvedValue(null);
    await expect(findOne.call(service, 2)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('updates a product', async () => {
    const { update: repoUpdate } = repo;
    const { update } = service;
    const dto: Partial<Product> = { name: 'New' };
    await expect(update.call(service, 1, dto as Product)).resolves.toEqual({
      id: 1,
    });
    expect(repoUpdate).toHaveBeenCalledWith(1, dto);
  });

  it('removes a product', async () => {
    const { delete: remove } = repo;
    const { remove: removeProduct } = service;
    await removeProduct.call(service, 1);
    expect(remove).toHaveBeenCalledWith(1);
  });
});

