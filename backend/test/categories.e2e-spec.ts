import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { UsersService } from '../src/users/users.service';
import { Role } from '../src/users/role.enum';

describe('CategoriesModule (e2e)', () => {
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

    it('allows public listing', () => {
        return request(app.getHttpServer()).get('/categories').expect(200);
    });

    it('admin can create and update', async () => {
        await users.createUser('admin@cat.com', 'secret', 'Admin', Role.Admin);
        const login = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'admin@cat.com', password: 'secret' })
            .expect(201);
        const token = login.body.access_token as string;
        const create = await request(app.getHttpServer())
            .post('/categories')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'hair' })
            .expect(201);
        await request(app.getHttpServer())
            .put(`/categories/${create.body.id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ description: 'desc' })
            .expect(200);
    });

    it('rejects duplicate name', async () => {
        await users.createUser('admin2@cat.com', 'secret', 'Admin', Role.Admin);
        const login = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'admin2@cat.com', password: 'secret' })
            .expect(201);
        const token = login.body.access_token as string;
        await request(app.getHttpServer())
            .post('/categories')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'makeup' })
            .expect(201);
        await request(app.getHttpServer())
            .post('/categories')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'makeup' })
            .expect(409);
    });
});
