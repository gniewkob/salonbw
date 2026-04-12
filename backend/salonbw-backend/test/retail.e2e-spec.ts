import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import * as jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import { Repository } from 'typeorm';

import { AuthModule } from '../src/auth/auth.module';
import { RetailModule } from '../src/retail/retail.module';
import { ProductsModule } from '../src/products/products.module';
import { UsersModule } from '../src/users/users.module';
import { User } from '../src/users/user.entity';
import { Product } from '../src/products/product.entity';
import { Appointment } from '../src/appointments/appointment.entity';
import { Service } from '../src/services/service.entity';
import { Commission } from '../src/commissions/commission.entity';
import { CommissionRule } from '../src/commissions/commission-rule.entity';
import { Log } from '../src/logs/log.entity';

const SKIP = process.env.SKIP_BIND_TESTS === '1';
const d = SKIP ? describe.skip : describe;

d('Retail (POS) integration', () => {
    let app: INestApplication;
    let server: Parameters<typeof request>[0];
    let userRepo: Repository<User>;
    let productRepo: Repository<Product>;
    let jwtToken: string;
    let employee: User;
    let product: Product;

    beforeAll(async () => {
        process.env.JWT_SECRET = 'test-secret';
        process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
        process.env.POS_ENABLED = 'true';
        process.env.PRODUCT_COMMISSION_PERCENT = '10';

        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                ConfigModule.forRoot({ isGlobal: true }),
                TypeOrmModule.forRoot({
                    type: 'sqlite',
                    database: ':memory:',
                    dropSchema: true,
                    entities: [
                        User,
                        Product,
                        Appointment,
                        Service,
                        Commission,
                        CommissionRule,
                        Log,
                    ],
                    synchronize: true,
                }),
                AuthModule,
                UsersModule,
                ProductsModule,
                RetailModule,
            ],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.use(cookieParser());
        await app.init();
        server = app.getHttpServer() as Parameters<typeof request>[0];

        userRepo = moduleFixture.get<Repository<User>>(
            getRepositoryToken(User),
        );
        productRepo = moduleFixture.get<Repository<Product>>(
            getRepositoryToken(Product),
        );

        employee = await userRepo.save({
            email: 'pos-emp@example.com',
            password: 'pass',
            name: 'POS Emp',
            role: 'employee',
            commissionBase: 0,
        });
        const jwtSecret = process.env.JWT_SECRET ?? '';
        jwtToken = jwt.sign({ sub: employee.id, role: 'employee' }, jwtSecret);

        product = await productRepo.save({
            name: 'Shampoo',
            brand: 'BW',
            unitPrice: 25,
            stock: 10,
        });
    });

    afterAll(async () => {
        await app.close();
    });

    it('creates a product sale and decrements stock', async () => {
        const res = await request(server)
            .post('/sales')
            .set('Authorization', `Bearer ${jwtToken}`)
            .send({
                productId: product.id,
                quantity: 2,
                employeeId: employee.id,
            })
            .expect(201);
        expect((res.body as { status: string }).status).toBe('ok');
        const updated = await productRepo.findOne({
            where: { id: product.id },
        });
        expect(updated?.stock).toBe(8);
    });

    it('rejects sale when insufficient stock', async () => {
        await request(server)
            .post('/sales')
            .set('Authorization', `Bearer ${jwtToken}`)
            .send({ productId: product.id, quantity: 999 })
            .expect(400);
    });

    it('adjusts inventory up with reason', async () => {
        const res = await request(server)
            .post('/inventory/adjust')
            .set('Authorization', `Bearer ${jwtToken}`)
            .send({
                productId: product.id,
                delta: 5,
                reason: 'delivery',
                note: 'batch X',
            })
            .expect(200);
        expect((res.body as { status: string }).status).toBe('ok');
        const updated = await productRepo.findOne({
            where: { id: product.id },
        });
        expect(updated?.stock).toBe(13);
    });
});
