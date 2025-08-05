import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { ReportsService } from '../src/reports/reports.service';
import { DataSource, Repository } from 'typeorm';
import { Appointment, PaymentStatus } from '../src/appointments/appointment.entity';
import { Sale } from '../src/sales/sale.entity';
import { CommissionRecord } from '../src/commissions/commission-record.entity';
import { User } from '../src/users/user.entity';
import { Role } from '../src/users/role.enum';
import { Service as CatalogService } from '../src/catalog/service.entity';
import { Product } from '../src/catalog/product.entity';

describe('ReportsService.getFinancialSummary (integration)', () => {
    let moduleRef: TestingModule;
    let reports: ReportsService;
    let dataSource: DataSource;
    let users: Repository<User>;
    let appointments: Repository<Appointment>;
    let sales: Repository<Sale>;
    let products: Repository<Product>;
    let commissions: Repository<CommissionRecord>;
    let services: Repository<CatalogService>;

    beforeEach(async () => {
        moduleRef = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        reports = moduleRef.get(ReportsService);
        dataSource = moduleRef.get(DataSource);
        users = dataSource.getRepository(User);
        appointments = dataSource.getRepository(Appointment);
        sales = dataSource.getRepository(Sale);
        products = dataSource.getRepository(Product);
        commissions = dataSource.getRepository(CommissionRecord);
        services = dataSource.getRepository(CatalogService);
    });

    afterEach(async () => {
        await moduleRef.close();
    });

    it('calculates financial summary for current month', async () => {
        const employee = await users.save({
            email: 'emp@report.com',
            password: 'secret',
            firstName: 'Emp',
            lastName: 'Report',
            role: Role.Employee,
        });
        const client = await users.save({
            email: 'client@report.com',
            password: 'secret',
            firstName: 'Cli',
            lastName: 'Ent',
            role: Role.Client,
        });
        const service = await services.findOne({ where: { name: 'cut' } });
        await appointments.save({
            client: { id: client.id } as any,
            employee: { id: employee.id } as any,
            service: { id: service!.id } as any,
            startTime: new Date(),
            paymentStatus: PaymentStatus.Paid,
        });
        const product = await products.save({
            name: 'gel',
            unitPrice: 20,
            stock: 10,
        });
        await sales.save({
            client: { id: client.id } as any,
            employee: { id: employee.id } as any,
            product: { id: product.id } as any,
            quantity: 2,
            soldAt: new Date(),
        });
        await commissions.save({
            employee: { id: employee.id } as any,
            appointment: null,
            product: { id: product.id } as any,
            amount: 5,
            percent: 10,
        });

        const summary = await reports.getFinancialSummary();
        expect(summary.serviceRevenue).toBeCloseTo(10);
        expect(summary.productRevenue).toBeCloseTo(40);
        expect(summary.totalRevenue).toBeCloseTo(50);
        expect(summary.revenuePerEmployee).toEqual([
            {
                employeeId: employee.id,
                serviceRevenue: 10,
                productRevenue: 40,
                totalRevenue: 50,
            },
        ]);
        expect(summary.commissionTotal).toBeCloseTo(5);
        expect(summary.serviceCount).toBe(1);
        expect(summary.newClients).toBe(1);
        expect(summary.averageBasketSize).toBeCloseTo(40);
    });
});

