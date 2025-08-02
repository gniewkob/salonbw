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
});
