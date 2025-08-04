import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { UsersService } from './../src/users/users.service';
import { Role } from './../src/users/role.enum';
import { AppointmentsService } from './../src/appointments/appointments.service';
import { ProductsService } from './../src/products/products.service';

describe('ProductUsage (e2e)', () => {
    let app: INestApplication<App>;
    let users: UsersService;
    let appointments: AppointmentsService;
    let products: ProductsService;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
        await app.init();

        users = moduleFixture.get(UsersService);
        appointments = moduleFixture.get(AppointmentsService);
        products = moduleFixture.get(ProductsService);
    });

    afterEach(async () => {
        if (app) {
            await app.close();
        }
    });

    it('employee can register product usage', async () => {
        const admin = await users.createUser(
            'admin@pu.com',
            'secret',
            'A',
            Role.Admin,
        );
        const employee = await users.createUser(
            'emp@pu.com',
            'secret',
            'E',
            Role.Employee,
        );
        const client = await users.createUser(
            'client@pu.com',
            'secret',
            'C',
            Role.Client,
        );

        const product = await products.create({
            name: 'gel',
            unitPrice: 5,
            stock: 3,
        } as any);
        const appt = await appointments.create(
            client.id,
            employee.id,
            1,
            new Date(Date.now() + 3600000).toISOString(),
        );

        const empLogin = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'emp@pu.com', password: 'secret' })
            .expect(201);
        const empToken = empLogin.body.access_token as string;

        await request(app.getHttpServer())
            .post(`/appointments/${appt.id}/product-usage`)
            .set('Authorization', `Bearer ${empToken}`)
            .send([{ productId: product.id, quantity: 2 }])
            .expect(201);

        const prod = await products.findOne(product.id);
        expect(prod!.stock).toBe(1);

        const adminLogin = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'admin@pu.com', password: 'secret' })
            .expect(201);
        const adminToken = adminLogin.body.access_token as string;

        const history = await request(app.getHttpServer())
            .get(`/products/${product.id}/usage-history`)
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200);
        expect(history.body.length).toBe(1);
        expect(history.body[0].usageType).toBe('INTERNAL');

        const logs = await request(app.getHttpServer())
            .get('/logs')
            .set('Authorization', `Bearer ${adminToken}`)
            .query({ action: 'PRODUCT_USED' })
            .expect(200);
        expect(
            logs.body.some((l: any) => {
                const desc = JSON.parse(l.description);
                return (
                    'appointmentId' in desc &&
                    'productId' in desc &&
                    'usageType' in desc &&
                    'quantity' in desc &&
                    'stock' in desc &&
                    desc.productId === product.id
                );
            }),
        ).toBe(true);
    });

    it('rejects usage with insufficient stock', async () => {
        const employee = await users.createUser(
            'emp2@pu.com',
            'secret',
            'E2',
            Role.Employee,
        );
        const client = await users.createUser(
            'client2@pu.com',
            'secret',
            'C2',
            Role.Client,
        );
        const product = await products.create({
            name: 'oil',
            unitPrice: 5,
            stock: 1,
        } as any);
        const appt = await appointments.create(
            client.id,
            employee.id,
            1,
            new Date(Date.now() + 7200000).toISOString(),
        );

        const empLogin = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'emp2@pu.com', password: 'secret' })
            .expect(201);
        const empToken = empLogin.body.access_token as string;

        await request(app.getHttpServer())
            .post(`/appointments/${appt.id}/product-usage`)
            .set('Authorization', `Bearer ${empToken}`)
            .send([{ productId: product.id, quantity: 5 }])
            .expect(409);
    });

    it('rejects usage with productId less than 1', async () => {
        const employee = await users.createUser(
            'emp0@pu.com',
            'secret',
            'E0',
            Role.Employee,
        );
        const client = await users.createUser(
            'client0@pu.com',
            'secret',
            'C0',
            Role.Client,
        );
        const appt = await appointments.create(
            client.id,
            employee.id,
            1,
            new Date(Date.now() + 3600000).toISOString(),
        );

        const empLogin = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'emp0@pu.com', password: 'secret' })
            .expect(201);
        const empToken = empLogin.body.access_token as string;

        await request(app.getHttpServer())
            .post(`/appointments/${appt.id}/product-usage`)
            .set('Authorization', `Bearer ${empToken}`)
            .send([{ productId: 0, quantity: 1 }])
            .expect(400);
    });

    it('allows overriding usageType to STOCK_CORRECTION', async () => {
        const admin = await users.createUser(
            'admino@pu.com',
            'secret',
            'AO',
            Role.Admin,
        );
        const employee = await users.createUser(
            'empo@pu.com',
            'secret',
            'EO',
            Role.Employee,
        );
        const client = await users.createUser(
            'cliento@pu.com',
            'secret',
            'CO',
            Role.Client,
        );

        const product = await products.create({
            name: 'wax',
            unitPrice: 5,
            stock: 2,
        } as any);
        const appt = await appointments.create(
            client.id,
            employee.id,
            1,
            new Date(Date.now() + 3600000).toISOString(),
        );

        const empLogin = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'empo@pu.com', password: 'secret' })
            .expect(201);
        const empToken = empLogin.body.access_token as string;

        await request(app.getHttpServer())
            .post(`/appointments/${appt.id}/product-usage`)
            .set('Authorization', `Bearer ${empToken}`)
            .send([{ productId: product.id, quantity: 1, usageType: 'STOCK_CORRECTION' }])
            .expect(201);

        const adminLogin = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'admino@pu.com', password: 'secret' })
            .expect(201);
        const adminToken = adminLogin.body.access_token as string;

        const history = await request(app.getHttpServer())
            .get(`/products/${product.id}/usage-history`)
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200);
        expect(history.body.length).toBe(1);
        expect(history.body[0].usageType).toBe('STOCK_CORRECTION');
    });

    it('rejects SALE usageType', async () => {
        const admin = await users.createUser(
            'adminr@pu.com',
            'secret',
            'AR',
            Role.Admin,
        );
        const employee = await users.createUser(
            'empr@pu.com',
            'secret',
            'ER',
            Role.Employee,
        );
        const client = await users.createUser(
            'clir@pu.com',
            'secret',
            'CR',
            Role.Client,
        );

        const product = await products.create({
            name: 'wax',
            unitPrice: 5,
            stock: 2,
        } as any);
        const appt = await appointments.create(
            client.id,
            employee.id,
            1,
            new Date(Date.now() + 3600000).toISOString(),
        );

        const empLogin = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'empr@pu.com', password: 'secret' })
            .expect(201);
        const empToken = empLogin.body.access_token as string;

        await request(app.getHttpServer())
            .post(`/appointments/${appt.id}/product-usage`)
            .set('Authorization', `Bearer ${empToken}`)
            .send([{ productId: product.id, quantity: 1, usageType: 'SALE' }])
            .expect(400);
    });

    it('filters usage history by usageType', async () => {
        const admin = await users.createUser(
            'adminf@pu.com',
            'secret',
            'AF',
            Role.Admin,
        );
        const employee = await users.createUser(
            'empf@pu.com',
            'secret',
            'EF',
            Role.Employee,
        );
        const client = await users.createUser(
            'clientf@pu.com',
            'secret',
            'CF',
            Role.Client,
        );

        const product = await products.create({
            name: 'shampoo',
            unitPrice: 5,
            stock: 5,
        } as any);
        const appt = await appointments.create(
            client.id,
            employee.id,
            1,
            new Date(Date.now() + 3600000).toISOString(),
        );

        const empLogin = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'empf@pu.com', password: 'secret' })
            .expect(201);
        const empToken = empLogin.body.access_token as string;

        await request(app.getHttpServer())
            .post(`/appointments/${appt.id}/product-usage`)
            .set('Authorization', `Bearer ${empToken}`)
            .send([{ productId: product.id, quantity: 1 }])
            .expect(201);

        const adminLogin = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'adminf@pu.com', password: 'secret' })
            .expect(201);
        const adminToken = adminLogin.body.access_token as string;

        await request(app.getHttpServer())
            .post('/sales')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                clientId: client.id,
                employeeId: employee.id,
                productId: product.id,
                quantity: 1,
            })
            .expect(201);

        const allHistory = await request(app.getHttpServer())
            .get(`/products/${product.id}/usage-history`)
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200);
        expect(allHistory.body.length).toBe(2);

        const saleHistory = await request(app.getHttpServer())
            .get(`/products/${product.id}/usage-history`)
            .set('Authorization', `Bearer ${adminToken}`)
            .query({ usageType: 'SALE' })
            .expect(200);
        expect(saleHistory.body.length).toBe(1);
        expect(saleHistory.body[0].usageType).toBe('SALE');

        const internalHistory = await request(app.getHttpServer())
            .get(`/products/${product.id}/usage-history`)
            .set('Authorization', `Bearer ${adminToken}`)
            .query({ usageType: 'INTERNAL' })
            .expect(200);
        expect(internalHistory.body.length).toBe(1);
        expect(internalHistory.body[0].usageType).toBe('INTERNAL');
    });

    it('logs stock correction on updateStock and not on increase', async () => {
        const admin = await users.createUser(
            'stockcorr@pu.com',
            'secret',
            'SC',
            Role.Admin,
        );

        const product = await products.create({
            name: 'scissors',
            unitPrice: 10,
            stock: 10,
        } as any);

        const login = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'stockcorr@pu.com', password: 'secret' })
            .expect(201);
        const token = login.body.access_token as string;

        await request(app.getHttpServer())
            .patch(`/products/admin/${product.id}/stock`)
            .set('Authorization', `Bearer ${token}`)
            .send({ amount: -5 })
            .expect(200);

        const historyAfterDecrease = await request(app.getHttpServer())
            .get(`/products/${product.id}/usage-history`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200);
        expect(historyAfterDecrease.body.length).toBe(1);
        expect(historyAfterDecrease.body[0].usageType).toBe('STOCK_CORRECTION');
        expect(historyAfterDecrease.body[0].quantity).toBe(5);

        await request(app.getHttpServer())
            .patch(`/products/admin/${product.id}/stock`)
            .set('Authorization', `Bearer ${token}`)
            .send({ amount: 5 })
            .expect(200);

        const historyAfterIncrease = await request(app.getHttpServer())
            .get(`/products/${product.id}/usage-history`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200);
        expect(historyAfterIncrease.body.length).toBe(1);
    });

    it('logs stock correction only when bulk decreasing stock', async () => {
        await users.createUser('bulkstock@pu.com', 'secret', 'BS', Role.Admin);
        const login = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'bulkstock@pu.com', password: 'secret' })
            .expect(201);
        const token = login.body.access_token as string;

        const p1 = await request(app.getHttpServer())
            .post('/products/admin')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'p1', unitPrice: 2, stock: 10 })
            .expect(201);
        const p2 = await request(app.getHttpServer())
            .post('/products/admin')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'p2', unitPrice: 2, stock: 20 })
            .expect(201);

        await request(app.getHttpServer())
            .patch('/products/admin/bulk-stock')
            .set('Authorization', `Bearer ${token}`)
            .send({
                entries: [
                    { id: p1.body.id, stock: 5 },
                    { id: p2.body.id, stock: 15 },
                ],
            })
            .expect(200);

        const p1HistoryAfterDecrease = await request(app.getHttpServer())
            .get(`/products/${p1.body.id}/usage-history`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200);
        expect(p1HistoryAfterDecrease.body.length).toBe(1);
        expect(p1HistoryAfterDecrease.body[0].usageType).toBe('STOCK_CORRECTION');
        expect(p1HistoryAfterDecrease.body[0].quantity).toBe(5);

        const p2HistoryAfterDecrease = await request(app.getHttpServer())
            .get(`/products/${p2.body.id}/usage-history`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200);
        expect(p2HistoryAfterDecrease.body.length).toBe(1);
        expect(p2HistoryAfterDecrease.body[0].usageType).toBe('STOCK_CORRECTION');
        expect(p2HistoryAfterDecrease.body[0].quantity).toBe(5);

        await request(app.getHttpServer())
            .patch('/products/admin/bulk-stock')
            .set('Authorization', `Bearer ${token}`)
            .send({
                entries: [
                    { id: p1.body.id, stock: 10 },
                    { id: p2.body.id, stock: 20 },
                ],
            })
            .expect(200);

        const p1HistoryAfterIncrease = await request(app.getHttpServer())
            .get(`/products/${p1.body.id}/usage-history`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200);
        expect(p1HistoryAfterIncrease.body.length).toBe(1);

        const p2HistoryAfterIncrease = await request(app.getHttpServer())
            .get(`/products/${p2.body.id}/usage-history`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200);
        expect(p2HistoryAfterIncrease.body.length).toBe(1);
    });
});
