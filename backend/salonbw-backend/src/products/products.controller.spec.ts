import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { Product } from './product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

describe('ProductsController', () => {
  let controller: ProductsController;
  let service: jest.Mocked<ProductsService>;
  let product: Product;
  let findAll: jest.Mock;
  let findOne: jest.Mock;
  let create: jest.Mock;
  let update: jest.Mock;
  let remove: jest.Mock;

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
        .mockImplementation((dto: CreateProductDto) =>
          Promise.resolve({ id: 1, ...dto }),
        ),
      update: jest
        .fn()
        .mockImplementation((id: number, dto: UpdateProductDto) =>
          Promise.resolve({
            ...product,
            ...dto,
            id,
          }),
        ),
      remove: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<ProductsService>;
    ({ findAll, findOne, create, update, remove } = service);
    controller = new ProductsController(service);
  });

  it('delegates findAll to service', async () => {
    const callFindAll = () => controller.findAll();
    await expect(callFindAll()).resolves.toEqual([product]);
    expect(findAll).toHaveBeenCalled();
  });

  it('delegates findOne to service', async () => {
    const callFindOne = () => controller.findOne(1);
    await expect(callFindOne()).resolves.toBe(product);
    expect(findOne).toHaveBeenCalledWith(1);
  });

  it('delegates create to service', async () => {
    const dto: CreateProductDto = {
      name: 'Shampoo',
      brand: 'Brand',
      unitPrice: 10,
      stock: 5,
    };
    const callCreate = () => controller.create(dto);
    await expect(callCreate()).resolves.toEqual({ id: 1, ...dto });
    expect(create).toHaveBeenCalledWith(dto);
  });

  it('delegates update to service', async () => {
    const dto: UpdateProductDto = { name: 'New' };
    const updated = { ...product, ...dto };
    const callUpdate = () => controller.update(1, dto);
    await expect(callUpdate()).resolves.toEqual(updated);
    expect(update).toHaveBeenCalledWith(1, dto);
  });

  it('delegates remove to service', async () => {
    const callRemove = () => controller.remove(1);
    await expect(callRemove()).resolves.toBeUndefined();
    expect(remove).toHaveBeenCalledWith(1);
  });
});

