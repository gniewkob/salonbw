import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { UsersService } from './../src/users/users.service';
import { Role } from './../src/users/role.enum';
import { ProductsService } from './../src/products/products.service';

describe('Sales (e2e)', () => {
    let app: INestApplication<App>;
    let users: UsersService;
    let products: ProductsService;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
        await app.init();

        users = moduleFixture.get(UsersService);
        products = moduleFixture.get(ProductsService);
    });

    afterEach(async () => {
        if (app) {
            await app.close();
        }
    });

    it('creates product usage on sale', async () => {
        const admin = await users.createUser(
            'admin@sales.com',
            'secret',
            'A',
            Role.Admin,
        );
        const employee = await users.createUser(
            'emp@sales.com',
            'secret',
            'E',
            Role.Employee,
        );
        const client = await users.createUser(
            'client@sales.com',
            'secret',
            'C',
            Role.Client,
        );

        const product = await products.create({
            name: 'gel',
            unitPrice: 5,
            stock: 3,
        } as any);

        const adminLogin = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'admin@sales.com', password: 'secret' })
            .expect(201);
        const token = adminLogin.body.access_token as string;

        await request(app.getHttpServer())
            .post('/sales')
            .set('Authorization', `Bearer ${token}`)
            .send({
                clientId: client.id,
                employeeId: employee.id,
                productId: product.id,
                quantity: 2,
            })
            .expect(201);

        const prod = await products.findOne(product.id);
        expect(prod!.stock).toBe(1);

        const history = await request(app.getHttpServer())
            .get(`/products/${product.id}/usage-history`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200);
        expect(history.body.length).toBe(1);
        expect(history.body[0].usageType).toBe('SALE');
        expect(history.body[0].quantity).toBe(2);

        const logs = await request(app.getHttpServer())
            .get('/logs')
            .set('Authorization', `Bearer ${token}`)
            .query({ action: 'PRODUCT_USED' })
            .expect(200);
        expect(
            logs.body.some((l: any) =>
                l.description.includes(`"usageType":"SALE"`) &&
                l.description.includes(`"productId":${product.id}`),
            ),
        ).toBe(true);
    });
});

