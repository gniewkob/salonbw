import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { Product } from './product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

describe('ProductsController', () => {
  let controller: ProductsController;
  let service: jest.Mocked<ProductsService>;
  let product: Product;

  beforeEach(() => {
    product = {
      id: 1,
      name: 'Shampoo',
      brand: 'Brand',
      unitPrice: 10,
      stock: 5,
    };

    service = {
      findAll: jest.fn().mockResolvedValue([product]),
      findOne: jest.fn().mockResolvedValue(product),
      create: jest
        .fn()
        .mockImplementation(async (dto: CreateProductDto) => ({ id: 1, ...dto })),
      update: jest
        .fn()
        .mockImplementation(async (id: number, dto: UpdateProductDto) => ({
          ...product,
          ...dto,
          id,
        })),
      remove: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<ProductsService>;
    controller = new ProductsController(service);
  });

  it('delegates findAll to service', async () => {
    await expect(controller.findAll()).resolves.toEqual([product]);
    expect(service.findAll).toHaveBeenCalled();
  });

  it('delegates findOne to service', async () => {
    await expect(controller.findOne(1)).resolves.toBe(product);
    expect(service.findOne).toHaveBeenCalledWith(1);
  });

  it('delegates create to service', async () => {
    const dto: CreateProductDto = {
      name: 'Shampoo',
      brand: 'Brand',
      unitPrice: 10,
      stock: 5,
    };
    await expect(controller.create(dto)).resolves.toEqual({ id: 1, ...dto });
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('delegates update to service', async () => {
    const dto: UpdateProductDto = { name: 'New' };
    const updated = { ...product, ...dto };
    await expect(controller.update(1, dto)).resolves.toEqual(updated);
    expect(service.update).toHaveBeenCalledWith(1, dto);
  });

  it('delegates remove to service', async () => {
    await expect(controller.remove(1)).resolves.toBeUndefined();
    expect(service.remove).toHaveBeenCalledWith(1);
  });
});

