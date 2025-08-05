import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { UsersService } from './../src/users/users.service';
import { Role } from './../src/users/role.enum';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
    Appointment,
    AppointmentStatus,
} from './../src/appointments/appointment.entity';
import { Customer } from './../src/customers/customer.entity';
import { Employee } from './../src/employees/employee.entity';
import { Service } from './../src/catalog/service.entity';
import { ReviewsService } from './../src/reviews/reviews.service';

describe('ReviewsModule (e2e)', () => {
    let app: INestApplication<App>;
    let users: UsersService;
    let appointmentsRepo: Repository<Appointment>;
    let reviews: ReviewsService;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
        await app.init();
        users = moduleFixture.get(UsersService);
        appointmentsRepo = moduleFixture.get(getRepositoryToken(Appointment));
        reviews = moduleFixture.get(ReviewsService);
    });

    afterEach(async () => {
        if (app) {
            await app.close();
        }
    });

    it('allows creating a review for a completed appointment', async () => {
        const client = await users.createUser(
            'client1@review.com',
            'secret',
            'C1',
            Role.Client,
        );
        const employee = await users.createUser(
            'emp1@review.com',
            'secret',
            'E1',
            Role.Employee,
        );

        const appointment = await appointmentsRepo.save(
            appointmentsRepo.create({
                client: { id: client.id } as Customer,
                employee: { id: employee.id } as Employee,
                service: { id: 1 } as Service,
                startTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
                endTime: new Date(Date.now() - 60 * 60 * 1000),
                status: AppointmentStatus.Completed,
            }),
        );

        const login = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'client1@review.com', password: 'secret' })
            .expect(201);
        const token = login.body.access_token as string;

        const res = await request(app.getHttpServer())
            .post(`/appointments/${appointment.id}/review`)
            .set('Authorization', `Bearer ${token}`)
            .send({ rating: 5, comment: 'ok' })
            .expect(201);
        expect(res.body).toHaveProperty('id');
        expect(res.body.rating).toBe(5);
    });

    it('rejects duplicate reviews for a reservation', async () => {
        const client = await users.createUser(
            'client@review.com',
            'secret',
            'C',
            Role.Client,
        );
        const employee = await users.createUser(
            'emp@review.com',
            'secret',
            'E',
            Role.Employee,
        );

        const appointment = await appointmentsRepo.save(
            appointmentsRepo.create({
                client: { id: client.id } as Customer,
                employee: { id: employee.id } as Employee,
                service: { id: 1 } as Service,
                startTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
                endTime: new Date(Date.now() - 60 * 60 * 1000),
                status: AppointmentStatus.Completed,
            }),
        );

        const login = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'client@review.com', password: 'secret' })
            .expect(201);
        const { access_token: token } = login.body as { access_token: string };

        await request(app.getHttpServer())
            .post(`/appointments/${appointment.id}/review`)
            .set('Authorization', `Bearer ${token}`)
            .send({ rating: 5 })
            .expect(201);

        await request(app.getHttpServer())
            .post(`/appointments/${appointment.id}/review`)
            .set('Authorization', `Bearer ${token}`)
            .send({ rating: 4 })
            .expect(409);
    });

    it('rejects review before appointment completion', async () => {
        const client = await users.createUser(
            'client2@review.com',
            'secret',
            'C2',
            Role.Client,
        );
        const employee = await users.createUser(
            'emp2@review.com',
            'secret',
            'E2',
            Role.Employee,
        );

        const appointment = await appointmentsRepo.save(
            appointmentsRepo.create({
                client: { id: client.id } as Customer,
                employee: { id: employee.id } as Employee,
                service: { id: 1 } as Service,
                startTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
                endTime: new Date(Date.now() - 60 * 60 * 1000),
                status: AppointmentStatus.Scheduled,
            }),
        );

        const login = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'client2@review.com', password: 'secret' })
            .expect(201);
        const token = login.body.access_token as string;

        await request(app.getHttpServer())
            .post(`/appointments/${appointment.id}/review`)
            .set('Authorization', `Bearer ${token}`)
            .send({ rating: 4 })
            .expect(400);
    });

    it('allows admin to delete review and rejects others', async () => {
        const admin = await users.createUser(
            'admin@review.com',
            'secret',
            'A',
            Role.Admin,
        );
        const client = await users.createUser(
            'client3@review.com',
            'secret',
            'C3',
            Role.Client,
        );
        const employee = await users.createUser(
            'emp3@review.com',
            'secret',
            'E3',
            Role.Employee,
        );

        const appointment = await appointmentsRepo.save(
            appointmentsRepo.create({
                client: { id: client.id } as Customer,
                employee: { id: employee.id } as Employee,
                service: { id: 1 } as Service,
                startTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
                endTime: new Date(Date.now() - 60 * 60 * 1000),
                status: AppointmentStatus.Completed,
            }),
        );

        const loginClient = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'client3@review.com', password: 'secret' })
            .expect(201);
        const clientToken = loginClient.body.access_token as string;

        const reviewRes = await request(app.getHttpServer())
            .post(`/appointments/${appointment.id}/review`)
            .set('Authorization', `Bearer ${clientToken}`)
            .send({ rating: 5 })
            .expect(201);
        const reviewId = reviewRes.body.id as number;

        const loginAdmin = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'admin@review.com', password: 'secret' })
            .expect(201);
        const adminToken = loginAdmin.body.access_token as string;

        await request(app.getHttpServer())
            .delete(`/reviews/${reviewId}`)
            .set('Authorization', `Bearer ${clientToken}`)
            .expect(403);

        await request(app.getHttpServer())
            .delete(`/reviews/${reviewId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200);
    });

    it('lists employee reviews with pagination and filters', async () => {
        const employee = await users.createUser(
            'emplist@review.com',
            'secret',
            'EL',
            Role.Employee,
        );
        const clientA = await users.createUser(
            'clientA@review.com',
            'secret',
            'CA',
            Role.Client,
        );
        const clientB = await users.createUser(
            'clientB@review.com',
            'secret',
            'CB',
            Role.Client,
        );
        const clientC = await users.createUser(
            'clientC@review.com',
            'secret',
            'CC',
            Role.Client,
        );

        const apptA = await appointmentsRepo.save(
            appointmentsRepo.create({
                client: { id: clientA.id } as Customer,
                employee: { id: employee.id } as Employee,
                service: { id: 1 } as Service,
                startTime: new Date(Date.now() - 3 * 60 * 60 * 1000),
                endTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
                status: AppointmentStatus.Completed,
            }),
        );
        const apptB = await appointmentsRepo.save(
            appointmentsRepo.create({
                client: { id: clientB.id } as Customer,
                employee: { id: employee.id } as Employee,
                service: { id: 1 } as Service,
                startTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
                endTime: new Date(Date.now() - 60 * 60 * 1000),
                status: AppointmentStatus.Completed,
            }),
        );
        const apptC = await appointmentsRepo.save(
            appointmentsRepo.create({
                client: { id: clientC.id } as Customer,
                employee: { id: employee.id } as Employee,
                service: { id: 1 } as Service,
                startTime: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
                endTime: new Date(Date.now() - 30 * 60 * 1000),
                status: AppointmentStatus.Completed,
            }),
        );

        await reviews.create({ appointmentId: apptA.id, rating: 5 }, clientA.id);
        await reviews.create({ appointmentId: apptB.id, rating: 4 }, clientB.id);
        await reviews.create({ appointmentId: apptC.id, rating: 5 }, clientC.id);

        const pageRes = await request(app.getHttpServer())
            .get(`/employees/${employee.id}/reviews?limit=2&page=2`)
            .expect(200);
        expect(pageRes.body.data).toHaveLength(1);
        expect(pageRes.body.total).toBe(3);
        expect(pageRes.body.page).toBe(2);
        expect(pageRes.body.limit).toBe(2);

        const filterRes = await request(app.getHttpServer())
            .get(`/employees/${employee.id}/reviews?rating=5`)
            .expect(200);
        expect(filterRes.body.total).toBe(2);
        filterRes.body.data.forEach((r: any) => {
            expect(r.rating).toBe(5);
        });
    });
});
