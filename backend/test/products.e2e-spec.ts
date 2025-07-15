import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
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
        app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
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
        await users.createUser('admin2@prod.com', 'secret', 'Admin', Role.Admin);

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
});
