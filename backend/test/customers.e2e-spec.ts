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
        await usersService.createUser(
            'admin@cust.com',
            'secret',
            'Admin',
            Role.Admin,
        );
        await usersService.createUser(
            'c1@test.com',
            'secret',
            'C1',
            Role.Client,
        );
        await usersService.createUser(
            'c2@test.com',
            'secret',
            'C2',
            Role.Client,
        );

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
            expect(c).toHaveProperty('email');
            expect(c).toHaveProperty('firstName');
            expect(c).toHaveProperty('lastName');
            expect(c).toHaveProperty('phone');
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
        const tokens = await authService.generateTokens(
            employee.id,
            EmployeeRole.FRYZJER,
        );
        const token = tokens.access_token;

        await request(app.getHttpServer())
            .get('/customers')
            .set('Authorization', `Bearer ${token}`)
            .expect(403);
    });

    it('returns 404 for missing customer', async () => {
        await usersService.createUser(
            'admin2@cust.com',
            'secret',
            'Admin',
            Role.Admin,
        );
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

    it('returns 400 for invalid customer id', async () => {
        await usersService.createUser(
            'admin3@cust.com',
            'secret',
            'Admin',
            Role.Admin,
        );
        const login = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'admin3@cust.com', password: 'secret' })
            .expect(201);
        const token = login.body.access_token as string;

        await request(app.getHttpServer())
            .get('/customers/abc')
            .set('Authorization', `Bearer ${token}`)
            .expect(400);
    });

    it('client can manage own profile and cannot change privacy consent', async () => {
        const register = await request(app.getHttpServer())
            .post('/auth/register')
            .send({
                email: 'self@test.com',
                password: 'Secret123!',
                firstName: 'Self',
                lastName: 'Client',
                phone: '+48123123130',
                privacyConsent: true,
                marketingConsent: false,
            })
            .expect(201);
        const token = register.body.access_token as string;

        const me = await request(app.getHttpServer())
            .get('/customers/me')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);
        expect(me.body.email).toBe('self@test.com');

        const updated = await request(app.getHttpServer())
            .put('/customers/me')
            .set('Authorization', `Bearer ${token}`)
            .send({
                firstName: 'Updated',
                marketingConsent: true,
                privacyConsent: false,
            })
            .expect(200);
        expect(updated.body.firstName).toBe('Updated');
        expect(updated.body.marketingConsent).toBe(true);
        expect(updated.body.privacyConsent).toBe(true);

        const dbUser = await usersService.findByEmail('self@test.com');
        expect(dbUser?.firstName).toBe('Updated');
        expect(dbUser?.marketingConsent).toBe(true);
        expect(dbUser?.privacyConsent).toBe(true);
    });

    it('admin can change customer marketing consent', async () => {
        await usersService.createUser(
            'mcadmin@test.com',
            'secret',
            'Admin',
            Role.Admin,
        );
        const client = await usersService.createUser(
            'mcclient@test.com',
            'secret',
            'Client',
            Role.Client,
        );
        const login = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'mcadmin@test.com', password: 'secret' })
            .expect(201);
        const token = login.body.access_token as string;

        const res = await request(app.getHttpServer())
            .patch(`/customers/${client.id}/marketing-consent`)
            .set('Authorization', `Bearer ${token}`)
            .send({ marketingConsent: true })
            .expect(200);
        expect(res.body.marketingConsent).toBe(true);
    });

    it('admin can deactivate and reactivate a customer', async () => {
        await usersService.createUser(
            'actadmin@test.com',
            'secret',
            'Admin',
            Role.Admin,
        );
        const client = await usersService.createUser(
            'actclient@test.com',
            'secret',
            'Client',
            Role.Client,
        );
        const login = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'actadmin@test.com', password: 'secret' })
            .expect(201);
        const token = login.body.access_token as string;

        const deactivated = await request(app.getHttpServer())
            .patch(`/customers/${client.id}/deactivate`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200);
        expect(deactivated.body.isActive).toBe(false);

        const activated = await request(app.getHttpServer())
            .patch(`/customers/${client.id}/activate`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200);
        expect(activated.body.isActive).toBe(true);
    });

    it('client can soft delete their account', async () => {
        const email = 'delme@test.com';
        const register = await request(app.getHttpServer())
            .post('/auth/register')
            .send({
                email,
                password: 'Secret123!',
                firstName: 'Del',
                lastName: 'Me',
                phone: '+48123123130',
                privacyConsent: true,
            })
            .expect(201);
        const token = register.body.access_token as string;
        const user = await usersService.findByEmail(email);
        const id = user!.id;

        await request(app.getHttpServer())
            .delete('/customers/me')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);

        await request(app.getHttpServer())
            .get('/customers/me')
            .set('Authorization', `Bearer ${token}`)
            .expect(404);

        await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email, password: 'Secret123!' })
            .expect(401);

        const repo = (usersService as any).usersRepository;
        const deleted = await repo.findOne({ where: { id }, withDeleted: true });
        expect(deleted).toBeDefined();
        expect(deleted.isActive).toBe(false);
        expect(deleted.deletedAt).toBeTruthy();
        expect(deleted.privacyConsent).toBe(false);
        expect(deleted.marketingConsent).toBe(false);
    });
});
