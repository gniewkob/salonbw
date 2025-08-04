import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { ProductsService } from '../src/products/products.service';
import { DataSource, Repository } from 'typeorm';
import { ProductUsage } from '../src/product-usage/product-usage.entity';
import { UsageType } from '../src/product-usage/usage-type.enum';
import { User } from '../src/users/user.entity';
import { Role } from '../src/users/role.enum';

describe('ProductsService stock correction (integration)', () => {
    let moduleRef: TestingModule;
    let products: ProductsService;
    let dataSource: DataSource;
    let usageRepo: Repository<ProductUsage>;
    let usersRepo: Repository<User>;

    beforeEach(async () => {
        moduleRef = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        products = moduleRef.get(ProductsService);
        dataSource = moduleRef.get(DataSource);
        usageRepo = dataSource.getRepository(ProductUsage);
        usersRepo = dataSource.getRepository(User);
    });

    afterEach(async () => {
        await moduleRef.close();
    });

    it('records STOCK_CORRECTION only when stock decreases with updateStock', async () => {
        const user = await usersRepo.save({
            email: 'stock@test.com',
            password: 'secret',
            firstName: 'Stock',
            lastName: 'Tester',
            role: Role.Admin,
        });

        const product = await products.create({
            name: 'shampoo',
            unitPrice: 10,
            stock: 10,
        } as any);

        await products.updateStock(product.id, -5, user.id);
        let usages = await usageRepo.find({ where: { product: { id: product.id } } });
        expect(usages).toHaveLength(1);
        expect(usages[0].usageType).toBe(UsageType.STOCK_CORRECTION);
        expect(usages[0].quantity).toBe(5);

        await products.updateStock(product.id, 5, user.id);
        usages = await usageRepo.find({ where: { product: { id: product.id } } });
        expect(usages).toHaveLength(1);
    });

    it('records STOCK_CORRECTION only for decreases in bulkUpdateStock', async () => {
        const user = await usersRepo.save({
            email: 'bulk@test.com',
            password: 'secret',
            firstName: 'Bulk',
            lastName: 'Tester',
            role: Role.Admin,
        });

        const p1 = await products.create({
            name: 'gel',
            unitPrice: 5,
            stock: 10,
        } as any);
        const p2 = await products.create({
            name: 'spray',
            unitPrice: 8,
            stock: 10,
        } as any);

        await products.bulkUpdateStock(
            [
                { id: p1.id, stock: 5 },
                { id: p2.id, stock: 15 },
            ],
            user.id,
        );

        const p1Usages = await usageRepo.find({ where: { product: { id: p1.id } } });
        expect(p1Usages).toHaveLength(1);
        expect(p1Usages[0].usageType).toBe(UsageType.STOCK_CORRECTION);
        expect(p1Usages[0].quantity).toBe(5);

        const p2Usages = await usageRepo.find({ where: { product: { id: p2.id } } });
        expect(p2Usages).toHaveLength(0);
    });
});
