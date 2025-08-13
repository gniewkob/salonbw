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
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest.fn().mockImplementation(async (entity) => ({ id: 1, ...entity })),
    find: jest.fn().mockResolvedValue([{ id: 1 } as Product]),
    findOne: jest.fn().mockResolvedValue({ id: 1 } as Product),
    update: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn().mockResolvedValue(undefined),
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
    const dto = { name: 'Shampoo', brand: 'Brand', unitPrice: 5, stock: 10 } as any;
    await expect(service.create(dto)).resolves.toEqual({ id: 1, ...dto });
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
    const dto = { name: 'New' } as any;
    await expect(service.update(1, dto)).resolves.toEqual({ id: 1 });
    expect(repo.update).toHaveBeenCalledWith(1, dto);
  });

  it('removes a product', async () => {
    await service.remove(1);
    expect(repo.delete).toHaveBeenCalledWith(1);
  });
});

