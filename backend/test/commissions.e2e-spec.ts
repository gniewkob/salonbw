import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { UsersService } from './../src/users/users.service';
import { Role } from './../src/users/role.enum';

describe('CommissionsModule (e2e)', () => {
    let app: INestApplication<App>;
    let usersService: UsersService;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
        await app.init();
        usersService = moduleFixture.get(UsersService);
    });

    afterEach(async () => {
        if (app) {
            await app.close();
        }
    });

    it('employee can list own commissions', async () => {
        await usersService.createUser('emp@comm.com', 'secret', 'Emp', Role.Employee);
        const login = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'emp@comm.com', password: 'secret' })
            .expect(201);
        const token = login.body.access_token;
        await request(app.getHttpServer())
            .get('/commissions/employee')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);
    });

    it('employee cannot access admin commissions', async () => {
        await usersService.createUser('emp2@comm.com', 'secret', 'Emp2', Role.Employee);
        const login = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'emp2@comm.com', password: 'secret' })
            .expect(201);
        const token = login.body.access_token;
        await request(app.getHttpServer())
            .get('/commissions/admin')
            .set('Authorization', `Bearer ${token}`)
            .expect(403);
    });
});
