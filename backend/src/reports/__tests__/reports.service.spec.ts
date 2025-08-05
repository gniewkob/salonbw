import { DataSource, getMetadataArgsStorage } from 'typeorm';
import { ReportsService } from '../reports.service';
import {
    Appointment,
    AppointmentStatus,
    PaymentStatus,
} from '../../appointments/appointment.entity';
import { Sale } from '../../sales/sale.entity';
import { CommissionRecord } from '../../commissions/commission-record.entity';
import { User } from '../../users/user.entity';
import { Role } from '../../users/role.enum';
import { Log } from '../../logs/log.entity';
import { LogAction } from '../../logs/action.enum';
import { Service as CatalogService } from '../../catalog/service.entity';
import { Product } from '../../catalog/product.entity';
import { Employee } from '../../employees/employee.entity';
import { Customer } from '../../customers/customer.entity';
import { EmployeeCommission } from '../../commissions/employee-commission.entity';
import { Category } from '../../catalog/category.entity';
import { Formula } from '../../formulas/formula.entity';

describe('ReportsService', () => {
    let dataSource: DataSource;
    let service: ReportsService;

    beforeAll(async () => {
        const storage = getMetadataArgsStorage();
        storage.columns.forEach((col) => {
            if (col.options.type === 'timestamptz') {
                col.options.type = 'datetime';
            }
            if (col.options.type === 'enum') {
                col.options.type = 'simple-enum';
            }
        });
        dataSource = new DataSource({
            type: 'sqlite',
            database: ':memory:',
            entities: [
                Appointment,
                Sale,
                CommissionRecord,
                User,
                Log,
                CatalogService,
                Category,
                Formula,
                Product,
                Employee,
                Customer,
                EmployeeCommission,
            ],
            synchronize: true,
        });
        await dataSource.initialize();
        service = new ReportsService(
            dataSource.getRepository(Appointment),
            dataSource.getRepository(Sale),
            dataSource.getRepository(CommissionRecord),
            dataSource.getRepository(User),
            dataSource.getRepository(Log),
        );
    });

    beforeEach(async () => {
        await dataSource.synchronize(true);
    });

    afterAll(async () => {
        await dataSource.destroy();
    });

    async function seedSampleData() {
        const users = dataSource.getRepository(User);
        const services = dataSource.getRepository(CatalogService);
        const products = dataSource.getRepository(Product);
        const appointments = dataSource.getRepository(Appointment);
        const sales = dataSource.getRepository(Sale);
        const commissions = dataSource.getRepository(CommissionRecord);

        const emp1 = await users.save({
            email: 'emp1@report.com',
            password: 'secret',
            firstName: 'Emp1',
            lastName: 'One',
            role: Role.Employee,
        });
        const emp2 = await users.save({
            email: 'emp2@report.com',
            password: 'secret',
            firstName: 'Emp2',
            lastName: 'Two',
            role: Role.Employee,
        });
        const client1 = await users.save({
            email: 'client1@report.com',
            password: 'secret',
            firstName: 'Cli1',
            lastName: 'Ent',
            role: Role.Client,
        });
        const oldDate = new Date();
        oldDate.setMonth(oldDate.getMonth() - 2);
        const client2 = await users.save({
            email: 'client2@report.com',
            password: 'secret',
            firstName: 'Cli2',
            lastName: 'Ent',
            role: Role.Client,
            createdAt: oldDate,
        });
        await users.update({ id: client2.id }, { createdAt: oldDate });

        const cut = await services.save({
            name: 'cut',
            duration: 30,
            price: 30,
        });
        const color = await services.save({
            name: 'color',
            duration: 60,
            price: 50,
        });

        const shampoo = await products.save({
            name: 'shampoo',
            unitPrice: 10,
            stock: 100,
        });
        const brush = await products.save({
            name: 'brush',
            unitPrice: 15,
            stock: 100,
        });

        const now = new Date();
        const later = new Date(now.getTime() + 60 * 60 * 1000);
        await appointments.save({
            client: { id: client1.id } as any,
            employee: { id: emp1.id } as any,
            service: { id: cut.id } as any,
            startTime: now,
            paymentStatus: PaymentStatus.Paid,
            status: AppointmentStatus.Completed,
        });
        await appointments.save({
            client: { id: client1.id } as any,
            employee: { id: emp1.id } as any,
            service: { id: color.id } as any,
            startTime: later,
            paymentStatus: PaymentStatus.Paid,
            status: AppointmentStatus.Completed,
        });
        await appointments.save({
            client: { id: client2.id } as any,
            employee: { id: emp2.id } as any,
            service: { id: cut.id } as any,
            startTime: now,
            paymentStatus: PaymentStatus.Paid,
            status: AppointmentStatus.Completed,
        });

        await sales.save({
            client: { id: client1.id } as any,
            employee: { id: emp1.id } as any,
            product: { id: shampoo.id } as any,
            quantity: 3,
            soldAt: now,
        });
        await sales.save({
            client: { id: client1.id } as any,
            employee: { id: emp1.id } as any,
            product: { id: brush.id } as any,
            quantity: 2,
            soldAt: now,
        });
        await sales.save({
            client: { id: client2.id } as any,
            employee: { id: emp2.id } as any,
            product: { id: shampoo.id } as any,
            quantity: 1,
            soldAt: now,
        });

        await commissions.save({
            employee: { id: emp1.id } as any,
            appointment: null,
            product: { id: shampoo.id } as any,
            amount: 10,
            percent: 10,
        });
        await commissions.save({
            employee: { id: emp2.id } as any,
            appointment: null,
            product: { id: shampoo.id } as any,
            amount: 5,
            percent: 10,
        });

        return {
            emp1,
            emp2,
            client1,
            client2,
            cut,
            color,
            shampoo,
            brush,
        };
    }

    it('calculates financial aggregates and per-employee revenue', async () => {
        const { emp1, emp2 } = await seedSampleData();
        const summary = await service.getFinancialSummary();

        expect(summary.serviceRevenue).toBeCloseTo(110);
        expect(summary.productRevenue).toBeCloseTo(70);
        expect(summary.totalRevenue).toBeCloseTo(180);
        expect(summary.revenuePerEmployee).toEqual(
            expect.arrayContaining([
                {
                    employeeId: emp1.id,
                    serviceRevenue: 80,
                    productRevenue: 60,
                    totalRevenue: 140,
                },
                {
                    employeeId: emp2.id,
                    serviceRevenue: 30,
                    productRevenue: 10,
                    totalRevenue: 40,
                },
            ]),
        );
        expect(summary.commissionTotal).toBeCloseTo(15);
        expect(summary.commissionPerEmployee).toEqual(
            expect.arrayContaining([
                { employeeId: emp1.id, amount: 10 },
                { employeeId: emp2.id, amount: 5 },
            ]),
        );
        expect(summary.serviceCount).toBe(3);
        expect(summary.newClients).toBe(1);
        expect(summary.averageBasketSize).toBeCloseTo(70 / 3);
    });

    it('provides per-employee calculations', async () => {
        const { emp1 } = await seedSampleData();
        const report = await service.getEmployeeReport(emp1.id);
        expect(report.serviceRevenue).toBeCloseTo(80);
        expect(report.productRevenue).toBeCloseTo(60);
        expect(report.totalRevenue).toBeCloseTo(140);
        expect(report.commissionTotal).toBeCloseTo(10);
        expect(report.completedAppointments).toBe(2);
        expect(report.productSales).toBe(2);
    });

    it('returns top services with limit', async () => {
        const { cut, color } = await seedSampleData();
        const topOne = await service.getTopServices(1);
        expect(topOne).toHaveLength(1);
        expect(topOne[0]).toMatchObject({
            serviceId: cut.id,
            count: 2,
            revenue: 60,
        });
        const topTwo = await service.getTopServices(2);
        expect(topTwo).toHaveLength(2);
        expect(topTwo[1]).toMatchObject({
            serviceId: color.id,
            count: 1,
            revenue: 50,
        });
    });

    it('returns top products with limit', async () => {
        const { shampoo, brush } = await seedSampleData();
        const topOne = await service.getTopProducts(1);
        expect(topOne).toHaveLength(1);
        expect(topOne[0]).toMatchObject({
            productId: shampoo.id,
            quantity: 4,
            revenue: 40,
        });
        const topTwo = await service.getTopProducts(2);
        expect(topTwo).toHaveLength(2);
        expect(topTwo[1]).toMatchObject({
            productId: brush.id,
            quantity: 2,
            revenue: 30,
        });
    });

    it('counts new customers without duplicates', async () => {
        const users = dataSource.getRepository(User);
        const logs = dataSource.getRepository(Log);
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

        const u1 = await users.save({
            email: 'u1@rep.com',
            password: 'secret',
            firstName: 'U1',
            lastName: 'One',
            role: Role.Client,
        });
        await logs.save({
            action: LogAction.RegisterSuccess,
            description: '',
            user: { id: u1.id } as any,
            actor: null,
            timestamp: new Date(start.getTime() + 1_000),
        });

        const old = new Date(start.getTime() - 2 * 24 * 60 * 60 * 1000);
        const u2 = await users.save({
            email: 'u2@rep.com',
            password: 'secret',
            firstName: 'U2',
            lastName: 'Two',
            role: Role.Client,
            createdAt: old,
        });
        await users.update({ id: u2.id }, { createdAt: old });
        await logs.save({
            action: LogAction.RegisterSuccess,
            description: '',
            user: { id: u2.id } as any,
            actor: null,
            timestamp: new Date(start.getTime() + 2_000),
        });

        const employee = await users.save({
            email: 'emp@rep.com',
            password: 'secret',
            firstName: 'Emp',
            lastName: 'Loyee',
            role: Role.Employee,
        });
        await logs.save({
            action: LogAction.RegisterSuccess,
            description: '',
            user: { id: employee.id } as any,
            actor: null,
            timestamp: new Date(start.getTime() + 3_000),
        });

        const result = await service.getNewCustomers(
            start.toISOString(),
            end.toISOString(),
        );
        expect(result.count).toBe(2);
    });

    it('exports financial data as CSV', async () => {
        await seedSampleData();
        const { fileName, csv } = await service.export('financial');
        expect(fileName).toBe('financial.csv');
        expect(csv).toContain('serviceRevenue');
        expect(csv).toContain('110');
    });
});

