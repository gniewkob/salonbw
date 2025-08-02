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
            logs.body.some((l: any) =>
                l.description.includes(`"productId":${product.id}`),
            ),
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

    it('allows overriding usageType', async () => {
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
            .send([{ productId: product.id, quantity: 1, usageType: 'SALE' }])
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
        expect(history.body[0].usageType).toBe('SALE');
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
});
