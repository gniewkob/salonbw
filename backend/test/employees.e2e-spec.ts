import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { UsersService } from './../src/users/users.service';
import { AuthService } from './../src/auth/auth.service';
import { Role } from './../src/users/role.enum';
import { EmployeeRole } from './../src/employees/employee-role.enum';
import { LogAction } from './../src/logs/action.enum';

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

    it('logs employee actions with actor and user ids', async () => {
        const admin = await usersService.createUser(
            'logadmin@emp.com',
            'secret',
            'Admin',
            Role.Admin,
        );
        const login = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'logadmin@emp.com', password: 'secret' })
            .expect(201);
        const token = login.body.access_token as string;

        const createRes = await request(app.getHttpServer())
            .post('/employees')
            .set('Authorization', `Bearer ${token}`)
            .send({
                email: 'emp@logs.com',
                firstName: 'Emp',
                lastName: 'Loyee',
                commissionBase: 10,
            })
            .expect(201);
        const empId = createRes.body.employee.id as number;

        await request(app.getHttpServer())
            .put(`/employees/${empId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ firstName: 'New' })
            .expect(200);

        await request(app.getHttpServer())
            .patch(`/employees/${empId}/deactivate`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200);

        await request(app.getHttpServer())
            .patch(`/employees/${empId}/activate`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200);

        await request(app.getHttpServer())
            .patch(`/employees/${empId}/commission`)
            .set('Authorization', `Bearer ${token}`)
            .send({ commissionBase: 15 })
            .expect(200);

        await request(app.getHttpServer())
            .delete(`/employees/${empId}`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200);

        const logsRes = await request(app.getHttpServer())
            .get('/logs')
            .set('Authorization', `Bearer ${token}`)
            .query({ userId: empId })
            .expect(200);

        const actions = logsRes.body.map((l: any) => l.action);
        expect(actions).toHaveLength(6);
        expect(actions).toEqual(
            expect.arrayContaining([
                LogAction.EmployeeCreate,
                LogAction.EmployeeUpdate,
                LogAction.EmployeeDeactivate,
                LogAction.EmployeeActivate,
                LogAction.EmployeeCommissionChange,
                LogAction.EmployeeDelete,
            ]),
        );
        logsRes.body.forEach((l: any) => {
            expect(l.actor.id).toBe(admin.id);
        });
    });

    it('employee can manage own profile without changing role or permissions', async () => {
        await usersService.createUser('me@test.com', 'secret', 'Emp', Role.Employee);

        const login = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'me@test.com', password: 'secret' })
            .expect(201);
        const token = login.body.access_token as string;

        const me = await request(app.getHttpServer())
            .get('/employees/me')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);
        expect(me.body.email).toBe('me@test.com');
        expect(me.body.role).toBe('employee');

        const updated = await request(app.getHttpServer())
            .patch('/employees/me')
            .set('Authorization', `Bearer ${token}`)
            .send({
                firstName: 'New',
                email: 'me2@test.com',
                role: 'admin',
                commissionBase: 20,
                isActive: false,
            })
            .expect(200);
        expect(updated.body.firstName).toBe('New');
        expect(updated.body.email).toBe('me2@test.com');
        expect(updated.body.role).toBe('employee');
        expect(updated.body.commissionBase).toBe(10);

        await request(app.getHttpServer())
            .patch('/employees/me')
            .set('Authorization', `Bearer ${token}`)
            .send({ password: 'Secret123!' })
            .expect(200);

        const dbUser = await usersService.findByEmail('me2@test.com');
        expect(dbUser?.role).toBe(Role.Employee);
        expect(dbUser?.commissionBase).toBe(10);
        expect(dbUser?.isActive).toBe(true);

        await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'me2@test.com', password: 'Secret123!' })
            .expect(201);
    });

    it('validates commission percentage and enforces admin role', async () => {
        const admin = await usersService.createUser(
            'adminc@emp.com',
            'secret',
            'Admin',
            Role.Admin,
        );
        const employee = await usersService.createUser(
            'empc@emp.com',
            'secret',
            'Emp',
            Role.Employee,
        );

        const adminLogin = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'adminc@emp.com', password: 'secret' })
            .expect(201);
        const adminToken = adminLogin.body.access_token as string;

        const employeeLogin = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'empc@emp.com', password: 'secret' })
            .expect(201);
        const employeeToken = employeeLogin.body.access_token as string;

        await request(app.getHttpServer())
            .patch(`/employees/${employee.id}/commission`)
            .set('Authorization', `Bearer ${employeeToken}`)
            .send({ commissionBase: 20 })
            .expect(403);

        await request(app.getHttpServer())
            .patch(`/employees/${employee.id}/commission`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ commissionBase: -5 })
            .expect(400);

        await request(app.getHttpServer())
            .patch(`/employees/${employee.id}/commission`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ commissionBase: 150 })
            .expect(400);

        const res = await request(app.getHttpServer())
            .patch(`/employees/${employee.id}/commission`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ commissionBase: 25.5 })
            .expect(200);
        expect(res.body.commissionBase).toBe(25.5);

        const dbUser = await usersService.findOne(employee.id);
        expect(dbUser?.commissionBase).toBe(25.5);
    });
});
