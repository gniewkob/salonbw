import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { Product } from './product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { User } from '../users/user.entity';

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
                .mockImplementation(
                    (dto: CreateProductDto, user: User): Promise<Product> => {
                        void user;
                        return Promise.resolve({ id: 1, ...dto });
                    },
                ),
            update: jest
                .fn()
                .mockImplementation(
                    (
                        id: number,
                        dto: UpdateProductDto,
                        user: User,
                    ): Promise<Product> => {
                        void user;
                        return Promise.resolve({
                            ...product,
                            ...dto,
                            id,
                        });
                    },
                ),
            remove: jest.fn().mockImplementation((id: number, user: User) => {
                void id;
                void user;
                return Promise.resolve(undefined);
            }),
        } as jest.Mocked<ProductsService>;
        controller = new ProductsController(service);
    });

    it('delegates findAll to service', async () => {
        const findAllSpy = jest.spyOn(service, 'findAll');
        await expect(controller.findAll()).resolves.toEqual([product]);
        expect(findAllSpy).toHaveBeenCalled();
    });

    it('delegates findOne to service', async () => {
        const findOneSpy = jest.spyOn(service, 'findOne');
        await expect(controller.findOne(1)).resolves.toBe(product);
        expect(findOneSpy).toHaveBeenCalledWith(1);
    });

    it('delegates create to service', async () => {
        const dto: CreateProductDto = {
            name: 'Shampoo',
            brand: 'Brand',
            unitPrice: 10,
            stock: 5,
        };
        const createSpy = jest.spyOn(service, 'create');
        const user = { userId: 1 };
        await expect(controller.create(dto, user)).resolves.toEqual({
            id: 1,
            ...dto,
        });
        expect(createSpy).toHaveBeenCalledWith(dto, { id: 1 });
    });

    it('delegates update to service', async () => {
        const dto: UpdateProductDto = { name: 'New' };
        const updated = { ...product, ...dto };
        const updateSpy = jest.spyOn(service, 'update');
        const user = { userId: 1 };
        await expect(controller.update(1, dto, user)).resolves.toEqual(updated);
        expect(updateSpy).toHaveBeenCalledWith(1, dto, { id: 1 });
    });

    it('delegates remove to service', async () => {
        const removeSpy = jest.spyOn(service, 'remove');
        const user = { userId: 1 };
        await expect(controller.remove(1, user)).resolves.toBeUndefined();
        expect(removeSpy).toHaveBeenCalledWith(1, { id: 1 });
    });
});
