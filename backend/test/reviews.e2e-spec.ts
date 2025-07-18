import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { UsersService } from './../src/users/users.service';
import { Role } from './../src/users/role.enum';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Appointment } from './../src/appointments/appointment.entity';
import { Customer } from './../src/customers/customer.entity';
import { Employee } from './../src/employees/employee.entity';
import { Service } from './../src/catalog/service.entity';

describe('ReviewsModule (e2e)', () => {
    let app: INestApplication<App>;
    let users: UsersService;
    let appointmentsRepo: Repository<Appointment>;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
        await app.init();
        users = moduleFixture.get(UsersService);
        appointmentsRepo = moduleFixture.get(getRepositoryToken(Appointment));
    });

    afterEach(async () => {
        if (app) {
            await app.close();
        }
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
                startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
            }),
        );

        const login = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'client@review.com', password: 'secret' })
            .expect(201);
        const { access_token: token } = login.body as { access_token: string };

        await request(app.getHttpServer())
            .post('/reviews')
            .set('Authorization', `Bearer ${token}`)
            .send({ reservationId: appointment.id, rating: 5 })
            .expect(201);

        await request(app.getHttpServer())
            .post('/reviews')
            .set('Authorization', `Bearer ${token}`)
            .send({ reservationId: appointment.id, rating: 4 })
            .expect(400);
    });
});
