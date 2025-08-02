import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { UsersService } from './../src/users/users.service';
import { Role } from './../src/users/role.enum';

describe('ProductsModule (e2e)', () => {
    let app: INestApplication<App>;
    let users: UsersService;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();
        users = moduleFixture.get(UsersService);
    });

    afterEach(async () => {
        if (app) {
            await app.close();
        }
    });

    it('rejects negative values on create', async () => {
        await users.createUser('admin@prod.com', 'secret', 'Admin', Role.Admin);

        const login = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'admin@prod.com', password: 'secret' })
            .expect(201);
        const token = login.body.access_token;

        await request(app.getHttpServer())
            .post('/products/admin')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'bad', unitPrice: -1, stock: 1 })
            .expect(400);

        await request(app.getHttpServer())
            .post('/products/admin')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'bad', unitPrice: 1, stock: -1 })
            .expect(400);
    });

    it('rejects negative values on update', async () => {
        await users.createUser(
            'admin2@prod.com',
            'secret',
            'Admin',
            Role.Admin,
        );

        const login = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'admin2@prod.com', password: 'secret' })
            .expect(201);
        const token = login.body.access_token;

        const res = await request(app.getHttpServer())
            .post('/products/admin')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'good', unitPrice: 5, stock: 2 })
            .expect(201);
        const id = res.body.id;

        await request(app.getHttpServer())
            .patch(`/products/admin/${id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ unitPrice: -3 })
            .expect(400);

        await request(app.getHttpServer())
            .patch(`/products/admin/${id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ stock: -2 })
            .expect(400);
    });

    it('admin can CRUD products and list low stock', async () => {
        await users.createUser('crud@prod.com', 'secret', 'Admin', Role.Admin);
        const login = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'crud@prod.com', password: 'secret' })
            .expect(201);
        const token = login.body.access_token as string;

        const create = await request(app.getHttpServer())
            .post('/products/admin')
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: 'shampoo',
                unitPrice: 10,
                stock: 5,
                lowStockThreshold: 4,
            })
            .expect(201);
        const id = create.body.id as number;

        const list = await request(app.getHttpServer())
            .get('/products')
            .expect(200);
        expect(list.body.some((p: any) => p.id === id)).toBe(true);

        await request(app.getHttpServer())
            .patch(`/products/admin/${id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ brand: 'best' })
            .expect(200);

        await request(app.getHttpServer())
            .patch(`/products/admin/${id}/stock`)
            .set('Authorization', `Bearer ${token}`)
            .send({ amount: -3 })
            .expect(200);

        const low = await request(app.getHttpServer())
            .get('/products/low-stock')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);
        expect(low.body.some((p: any) => p.id === id)).toBe(true);

        await request(app.getHttpServer())
            .delete(`/products/admin/${id}`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200);

        await request(app.getHttpServer()).get(`/products/${id}`).expect(404);
    });

    it('enforces authorization', async () => {
        await users.createUser('client@prod.com', 'secret', 'C', Role.Client);
        const login = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'client@prod.com', password: 'secret' })
            .expect(201);
        const token = login.body.access_token as string;

        await request(app.getHttpServer())
            .post('/products/admin')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'x', unitPrice: 1, stock: 1 })
            .expect(403);

        await request(app.getHttpServer())
            .get('/products/low-stock')
            .set('Authorization', `Bearer ${token}`)
            .expect(403);
    });

    it('cannot delete product with sales', async () => {
        const admin = await users.createUser(
            'saleadmin@prod.com',
            'secret',
            'A',
            Role.Admin,
        );
        const employee = await users.createUser(
            'saleemp@prod.com',
            'secret',
            'E',
            Role.Employee,
        );
        const client = await users.createUser(
            'saleclient@prod.com',
            'secret',
            'C',
            Role.Client,
        );

        const login = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'saleadmin@prod.com', password: 'secret' })
            .expect(201);
        const token = login.body.access_token as string;

        const prod = await request(app.getHttpServer())
            .post('/products/admin')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'nails', unitPrice: 5, stock: 5 })
            .expect(201);
        const id = prod.body.id;

        await request(app.getHttpServer())
            .post('/sales')
            .set('Authorization', `Bearer ${token}`)
            .send({
                clientId: client.id,
                employeeId: employee.id,
                productId: id,
                quantity: 1,
            })
            .expect(201);

        await request(app.getHttpServer())
            .delete(`/products/admin/${id}`)
            .set('Authorization', `Bearer ${token}`)
            .expect(409);
    });

    it('admin can bulk update stock', async () => {
        await users.createUser('bulk@prod.com', 'secret', 'A', Role.Admin);
        const login = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'bulk@prod.com', password: 'secret' })
            .expect(201);
        const token = login.body.access_token as string;

        const p1 = await request(app.getHttpServer())
            .post('/products/admin')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'p1', unitPrice: 2, stock: 5 })
            .expect(201);
        const p2 = await request(app.getHttpServer())
            .post('/products/admin')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'p2', unitPrice: 3, stock: 2 })
            .expect(201);

        await request(app.getHttpServer())
            .patch('/products/admin/bulk-stock')
            .set('Authorization', `Bearer ${token}`)
            .send({
                entries: [
                    { id: p1.body.id, stock: 3 },
                    { id: p2.body.id, stock: 4 },
                ],
            })
            .expect(200);

        const res = await request(app.getHttpServer())
            .get(`/products/${p1.body.id}`)
            .expect(200);
        expect(res.body.stock).toBe(3);

        const logs = await request(app.getHttpServer())
            .get('/logs')
            .set('Authorization', `Bearer ${token}`)
            .query({ action: 'BULK_UPDATE_PRODUCT_STOCK' })
            .expect(200);
        expect(logs.body.length).toBe(2);

        const usedLogs = await request(app.getHttpServer())
            .get('/logs')
            .set('Authorization', `Bearer ${token}`)
            .query({ action: 'PRODUCT_USED' })
            .expect(200);
        expect(usedLogs.body.length).toBe(1);
        const payload = JSON.parse(usedLogs.body[0].data);
        expect(payload.usageType).toBe('STOCK_CORRECTION');
    });

    it('rejects bulk update with negative stock', async () => {
        await users.createUser('bulk2@prod.com', 'secret', 'A', Role.Admin);
        const login = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'bulk2@prod.com', password: 'secret' })
            .expect(201);
        const token = login.body.access_token as string;

        const p = await request(app.getHttpServer())
            .post('/products/admin')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'pneg', unitPrice: 2, stock: 1 })
            .expect(201);

        await request(app.getHttpServer())
            .patch('/products/admin/bulk-stock')
            .set('Authorization', `Bearer ${token}`)
            .send({ entries: [{ id: p.body.id, stock: -1 }] })
            .expect(400);
    });
});
