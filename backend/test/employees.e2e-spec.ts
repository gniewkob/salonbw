import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { UsersService } from './../src/users/users.service';
import { AuthService } from './../src/auth/auth.service';
import { Role } from './../src/users/role.enum';
import { EmployeeRole } from './../src/employees/employee-role.enum';

describe('EmployeesController (e2e)', () => {
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

    it('admin can list employees', async () => {
        await usersService.createUser('admin@emp.com', 'secret', 'Admin', Role.Admin);
        await usersService.createUser('e1@test.com', 'secret', 'E1', Role.Employee);
        await usersService.createUser('e2@test.com', 'secret', 'E2', Role.Employee);

        const login = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'admin@emp.com', password: 'secret' })
            .expect(201);
        const token = login.body.access_token as string;

        const res = await request(app.getHttpServer())
            .get('/employees')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);

        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(3);
        res.body.forEach((e: any) => {
            expect(e).not.toHaveProperty('password');
            expect(e).not.toHaveProperty('refreshToken');
            expect(e).toHaveProperty('email');
            expect(e).toHaveProperty('firstName');
            expect(e).toHaveProperty('lastName');
            expect(e).toHaveProperty('fullName');
            expect(e).toHaveProperty('phone');
            expect([Role.Employee, Role.Admin]).toContain(e.role);
        });
    });

    it('rejects unauthorized access', async () => {
        await request(app.getHttpServer()).get('/employees').expect(401);

        const client = await usersService.createUser('client@emp.com', 'secret', 'C', Role.Client);
        const loginClient = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'client@emp.com', password: 'secret' })
            .expect(201);
        const clientToken = loginClient.body.access_token as string;
        await request(app.getHttpServer())
            .get('/employees')
            .set('Authorization', `Bearer ${clientToken}`)
            .expect(403);

        const employee = await usersService.createUser('emp@test.com', 'secret', 'E', Role.Employee);
        const tokens = await authService.generateTokens(employee.id, EmployeeRole.FRYZJER);
        await request(app.getHttpServer())
            .get('/employees')
            .set('Authorization', `Bearer ${tokens.access_token}`)
            .expect(403);
    });

    it('returns 404 for missing employee', async () => {
        await usersService.createUser('admin2@emp.com', 'secret', 'Admin', Role.Admin);
        const login = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'admin2@emp.com', password: 'secret' })
            .expect(201);
        const token = login.body.access_token as string;

        await request(app.getHttpServer())
            .get('/employees/999')
            .set('Authorization', `Bearer ${token}`)
            .expect(404);
    });

    it('returns 400 for invalid employee id', async () => {
        await usersService.createUser('admin3@emp.com', 'secret', 'Admin', Role.Admin);
        const login = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'admin3@emp.com', password: 'secret' })
            .expect(201);
        const token = login.body.access_token as string;

        await request(app.getHttpServer())
            .get('/employees/abc')
            .set('Authorization', `Bearer ${token}`)
            .expect(400);
    });
});
