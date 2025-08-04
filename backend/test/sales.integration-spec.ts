import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { SalesService } from '../src/sales/sales.service';
import { ProductsService } from '../src/products/products.service';
import { DataSource, Repository } from 'typeorm';
import { Sale } from '../src/sales/sale.entity';
import { CommissionRecord } from '../src/commissions/commission-record.entity';
import { ProductUsage } from '../src/product-usage/product-usage.entity';
import { UsageType } from '../src/product-usage/usage-type.enum';
import { User } from '../src/users/user.entity';
import { Role } from '../src/users/role.enum';


describe('SalesService.create (integration)', () => {
    let moduleRef: TestingModule;
    let sales: SalesService;
    let products: ProductsService;
    let dataSource: DataSource;
    let saleRepo: Repository<Sale>;
    let commissionRepo: Repository<CommissionRecord>;
    let usageRepo: Repository<ProductUsage>;
    let usersRepo: Repository<User>;

    beforeEach(async () => {
        moduleRef = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        sales = moduleRef.get(SalesService);
        products = moduleRef.get(ProductsService);
        dataSource = moduleRef.get(DataSource);
        saleRepo = dataSource.getRepository(Sale);
        commissionRepo = dataSource.getRepository(CommissionRecord);
        usageRepo = dataSource.getRepository(ProductUsage);
        usersRepo = dataSource.getRepository(User);
    });

    afterEach(async () => {
        await moduleRef.close();
    });

    it('creates sale, commission record and product usage', async () => {
        const employee = await usersRepo.save({
            email: 'emp@salesvc.com',
            password: 'secret',
            firstName: 'Emp',
            lastName: 'Sales',
            role: Role.Employee,
        });
        const client = await usersRepo.save({
            email: 'client@salesvc.com',
            password: 'secret',
            firstName: 'Cli',
            lastName: 'Ent',
            role: Role.Client,
        });
        const product = await products.create({
            name: 'gel',
            unitPrice: 10,
            stock: 5,
        } as any);

        await sales.create(client.id, employee.id, product.id, 2);

        const salesList = await saleRepo.find();
        expect(salesList).toHaveLength(1);
        expect(salesList[0].quantity).toBe(2);

        const commissions = await commissionRepo.find();
        expect(commissions).toHaveLength(1);
        expect(commissions[0].percent).toBe(13);
        expect(commissions[0].amount).toBeCloseTo(10 * 2 * 0.13);

        const usages = await usageRepo.find();
        expect(usages).toHaveLength(1);
        expect(usages[0].usageType).toBe(UsageType.SALE);
    });
});

