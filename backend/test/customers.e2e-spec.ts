import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { UsersService } from './../src/users/users.service';
import { AuthService } from './../src/auth/auth.service';
import { Role } from './../src/users/role.enum';
import { EmployeeRole } from './../src/employees/employee-role.enum';

describe('CustomersController (e2e)', () => {
    let app: INestApplication<App>;
    let usersService: UsersService;
    let authService: AuthService;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
        await app.init();
        usersService = moduleFixture.get(UsersService);
        authService = moduleFixture.get(AuthService);
    });

    afterEach(async () => {
        if (app) {
            await app.close();
        }
    });

    it('admin can list customers', async () => {
        await usersService.createUser('admin@cust.com', 'secret', 'Admin', Role.Admin);
        await usersService.createUser('c1@test.com', 'secret', 'C1', Role.Client);
        await usersService.createUser('c2@test.com', 'secret', 'C2', Role.Client);

        const login = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'admin@cust.com', password: 'secret' })
            .expect(201);
        const token = login.body.access_token as string;

        const res = await request(app.getHttpServer())
            .get('/customers')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);

        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(2);
        res.body.forEach((c: any) => {
            expect(c).not.toHaveProperty('password');
            expect(c).not.toHaveProperty('refreshToken');
            expect(c.role).toBe('client');
        });
    });

    it('rejects unauthorized access', async () => {
        await request(app.getHttpServer()).get('/customers').expect(401);

        const employee = await usersService.createUser(
            'emp@test.com',
            'secret',
            'E',
            Role.Employee,
        );
        const tokens = await authService.generateTokens(employee.id, EmployeeRole.FRYZJER);
        const token = tokens.access_token;

        await request(app.getHttpServer())
            .get('/customers')
            .set('Authorization', `Bearer ${token}`)
            .expect(403);
    });

    it('returns 404 for missing customer', async () => {
        await usersService.createUser('admin2@cust.com', 'secret', 'Admin', Role.Admin);
        const login = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'admin2@cust.com', password: 'secret' })
            .expect(201);
        const token = login.body.access_token as string;

        await request(app.getHttpServer())
            .get('/customers/999')
            .set('Authorization', `Bearer ${token}`)
            .expect(404);
    });
});
