import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { UsersService } from './../src/users/users.service';
import { AppointmentsService } from './../src/appointments/appointments.service';
import { Role } from './../src/users/role.enum';
import { ChatMessagesService } from './../src/chat-messages/chat-messages.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Service as CatalogService } from './../src/catalog/service.entity';

describe('ChatMessages (e2e)', () => {
    let app: INestApplication<App>;
    let users: UsersService;
    let appointments: AppointmentsService;
    let chat: ChatMessagesService;
    let servicesRepo: Repository<CatalogService>;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
        await app.init();

        users = moduleFixture.get(UsersService);
        appointments = moduleFixture.get(AppointmentsService);
        chat = moduleFixture.get(ChatMessagesService);
        servicesRepo = moduleFixture.get(getRepositoryToken(CatalogService));
    });

    afterEach(async () => {
        if (app) {
            await app.close();
        }
    });

    it('returns messages for appointment', async () => {
        await servicesRepo.save(
            servicesRepo.create({ name: 'cut', duration: 30, price: 10 }),
        );
        const client = await users.createUser(
            'chatc@test.com',
            'secret',
            'C',
            Role.Client,
        );
        const emp = await users.createUser(
            'chate@test.com',
            'secret',
            'E',
            Role.Employee,
        );
        const start = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        const appt = await appointments.create(client.id, emp.id, 1, start);

        await chat.create(appt.id, client.id, 'hello');
        await chat.create(appt.id, emp.id, 'hi');

        const login = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'chatc@test.com', password: 'secret' })
            .expect(201);

        const token = login.body.access_token;

        const res = await request(app.getHttpServer())
            .get(`/appointments/${appt.id}/chat`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200);
        expect(res.body.length).toBe(2);
        expect(res.body[0]).toHaveProperty('message');
    });
});
