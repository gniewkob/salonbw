import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { UsersService } from './../src/users/users.service';
import { LogsService } from './../src/logs/logs.service';
import { Role } from './../src/users/role.enum';
import { LogAction } from './../src/logs/action.enum';

describe('LogsModule (e2e)', () => {
    let app: INestApplication<App>;
    let usersService: UsersService;
    let logsService: LogsService;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
        await app.init();
        usersService = moduleFixture.get(UsersService);
        logsService = moduleFixture.get(LogsService);
    });

    afterEach(async () => {
        if (app) {
            await app.close();
        }
    });

    it('rejects unauthenticated requests', () => {
        return request(app.getHttpServer()).get('/logs').expect(401);
    });

    it('forbids client from accessing logs', async () => {
        await request(app.getHttpServer())
            .post('/auth/register')
            .send({
                email: 'client@logs.com',
                password: 'Secret123!',
                firstName: 'Client',
                lastName: 'User',
                phone: '+48123123131',
                privacyConsent: true,
            })
            .expect(201);

        const login = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'client@logs.com', password: 'Secret123!' })
            .expect(201);

        const token = login.body.access_token;

        await request(app.getHttpServer())
            .get('/logs')
            .set('Authorization', `Bearer ${token}`)
            .expect(403);
    });

    it('admin can fetch logs with filters', async () => {
        const admin = await usersService.createUser(
            'admin@logs.com',
            'secret',
            'Admin',
            Role.Admin,
        );
        const other = await usersService.createUser(
            'other@logs.com',
            'secret',
            'Other',
            Role.Client,
        );

        const log = await logsService.create(
            LogAction.LoginSuccess,
            'admin logged in',
            admin.id,
        );
        await logsService.create(LogAction.LoginFail, 'other fail', other.id);

        const login = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'admin@logs.com', password: 'secret' })
            .expect(201);
        const token = login.body.access_token;

        const res = await request(app.getHttpServer())
            .get('/logs')
            .set('Authorization', `Bearer ${token}`)
            .query({ userId: admin.id, action: LogAction.LoginSuccess })
            .expect(200);

        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(1);
        expect(res.body[0].id).toBe(log.id);
    });

    it('records appointment creation and cancellation', async () => {
        const admin = await usersService.createUser(
            'apadmin@logs.com',
            'secret',
            'Admin',
            Role.Admin,
        );
        const client = await usersService.createUser(
            'apclient@logs.com',
            'secret',
            'Client',
            Role.Client,
        );

        const clientLogin = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'apclient@logs.com', password: 'secret' })
            .expect(201);
        const clientToken = clientLogin.body.access_token;

        const startTime = new Date(Date.now() + 60 * 60 * 1000).toISOString();
        const createRes = await request(app.getHttpServer())
            .post('/appointments/client')
            .set('Authorization', `Bearer ${clientToken}`)
            .send({ employeeId: admin.id, serviceId: 1, startTime })
            .expect(201);
        const apptId = createRes.body.id;

        const adminLogin = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'apadmin@logs.com', password: 'secret' })
            .expect(201);
        const adminToken = adminLogin.body.access_token;

        await request(app.getHttpServer())
            .patch(`/appointments/admin/${apptId}/cancel`)
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200);

        const createLogs = await request(app.getHttpServer())
            .get('/logs')
            .set('Authorization', `Bearer ${adminToken}`)
            .query({ action: LogAction.CreateAppointment })
            .expect(200);

        const cancelLogs = await request(app.getHttpServer())
            .get('/logs')
            .set('Authorization', `Bearer ${adminToken}`)
            .query({ action: LogAction.CancelAppointment })
            .expect(200);

        expect(createLogs.body.length).toBeGreaterThanOrEqual(1);
        expect(cancelLogs.body.length).toBeGreaterThanOrEqual(1);
    });

    it('records profile updates and marketing consent changes', async () => {
        const admin = await usersService.createUser(
            'profileadmin@logs.com',
            'secret',
            'Admin',
            Role.Admin,
        );
        const client = await usersService.createUser(
            'profileclient@logs.com',
            'secret',
            'Client',
            Role.Client,
        );

        const clientLogin = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'profileclient@logs.com', password: 'secret' })
            .expect(201);
        const clientToken = clientLogin.body.access_token as string;

        await request(app.getHttpServer())
            .put('/customers/me')
            .set('Authorization', `Bearer ${clientToken}`)
            .send({ firstName: 'New' })
            .expect(200);

        await request(app.getHttpServer())
            .put('/customers/me')
            .set('Authorization', `Bearer ${clientToken}`)
            .send({ marketingConsent: true })
            .expect(200);

        const adminLogin = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'profileadmin@logs.com', password: 'secret' })
            .expect(201);
        const adminToken = adminLogin.body.access_token as string;

        const profileLogs = await request(app.getHttpServer())
            .get('/logs')
            .set('Authorization', `Bearer ${adminToken}`)
            .query({
                action: LogAction.ProfileUpdate,
                userId: client.id,
            })
            .expect(200);

        const consentLogs = await request(app.getHttpServer())
            .get('/logs')
            .set('Authorization', `Bearer ${adminToken}`)
            .query({
                action: LogAction.MarketingConsentChange,
                userId: client.id,
            })
            .expect(200);

        expect(profileLogs.body.length).toBeGreaterThanOrEqual(1);
        expect(consentLogs.body.length).toBeGreaterThanOrEqual(1);
    });
});
