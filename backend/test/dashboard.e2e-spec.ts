import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { UsersService } from './../src/users/users.service';
import { AppointmentsService } from './../src/appointments/appointments.service';
import { ReviewsService } from './../src/reviews/reviews.service';
import { NotificationsService } from './../src/notifications/notifications.service';
import { Role } from './../src/users/role.enum';
import { EmployeeCommission } from './../src/commissions/employee-commission.entity';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Product } from './../src/catalog/product.entity';
import { LogAction } from './../src/logs/action.enum';
import { LogsService } from './../src/logs/logs.service';

describe('Dashboard (e2e)', () => {
    let app: INestApplication<App>;
    let users: UsersService;
    let appointments: AppointmentsService;
    let reviews: ReviewsService;
    let notifications: NotificationsService;
    let commissionsRepo: Repository<EmployeeCommission>;
    let products: Repository<Product>;
    let logs: LogsService;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
        await app.init();

        users = moduleFixture.get(UsersService);
        appointments = moduleFixture.get(AppointmentsService);
        reviews = moduleFixture.get(ReviewsService);
        notifications = moduleFixture.get(NotificationsService);
        commissionsRepo = moduleFixture.get(
            getRepositoryToken(EmployeeCommission),
        );
        products = moduleFixture.get(getRepositoryToken(Product));
        logs = moduleFixture.get(LogsService);
    });

    afterEach(async () => {
        if (app) await app.close();
    });

    it('rejects unauthenticated requests', () => {
        return request(app.getHttpServer()).get('/dashboard').expect(401);
    });

    it('returns summary for client', async () => {
        const client = await users.createUser(
            'client@dash.com',
            'secret',
            'Client',
            Role.Client,
            '+48123123123',
        );
        const employee = await users.createUser(
            'emp@dash.com',
            'secret',
            'Emp',
            Role.Employee,
        );
        const login = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'client@dash.com', password: 'secret' })
            .expect(201);
        const token = login.body.access_token as string;
        const start = new Date(Date.now() + 3600 * 1000).toISOString();
        await appointments.create(client.id, employee.id, 1, start);
        const appt = await appointments.create(
            client.id,
            employee.id,
            1,
            new Date(Date.now() + 7200 * 1000).toISOString(),
        );
        await reviews.create({ reservationId: appt.id, rating: 5 });
        await notifications.sendNotification(
            client.phone as string,
            'hi',
            'whatsapp',
        );
        const res = await request(app.getHttpServer())
            .get('/dashboard')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);
        expect(res.body.fullName).toBe('Client');
        expect(res.body.upcomingAppointments).toBe(2);
    });

    it('returns summary for employee', async () => {
        const client = await users.createUser(
            'client2@dash.com',
            'secret',
            'Client2',
            Role.Client,
        );
        const employee = await users.createUser(
            'emp2@dash.com',
            'secret',
            'Emp2',
            Role.Employee,
        );
        const login = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'emp2@dash.com', password: 'secret' })
            .expect(201);
        const token = login.body.access_token as string;
        const start = new Date().toISOString();
        await appointments.create(client.id, employee.id, 1, start);
        await commissionsRepo.save(
            commissionsRepo.create({
                employee: { id: employee.id } as any,
                amount: 10,
                percent: 10,
            }),
        );
        const res = await request(app.getHttpServer())
            .get('/dashboard')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);
        expect(res.body.fullName).toBe('Emp2');
        expect(res.body.todayAppointments).toBe(1);
    });

    it('returns summary for admin', async () => {
        const admin = await users.createUser(
            'adm@dash.com',
            'secret',
            'Adm',
            Role.Admin,
        );
        const login = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'adm@dash.com', password: 'secret' })
            .expect(201);
        const token = login.body.access_token as string;
        await products.save(
            products.create({ name: 'p', unitPrice: 10, stock: 2 }),
        );
        await logs.create(LogAction.RegisterSuccess, 'reg', admin.id);
        const start = new Date().toISOString();
        await appointments.create(admin.id, admin.id, 1, start);
        const res = await request(app.getHttpServer())
            .get('/dashboard')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);
        expect(res.body.fullName).toBe('Adm');
        expect(res.body.todayAppointments).toBe(1);
    });
});
