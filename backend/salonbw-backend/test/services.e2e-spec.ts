import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import { Repository } from 'typeorm';

import { AuthModule } from '../src/auth/auth.module';
import { ServicesModule } from '../src/services/services.module';
import { User } from '../src/users/user.entity';
import { Service } from '../src/services/service.entity';

const SKIP = process.env.SKIP_BIND_TESTS === '1';
const d = SKIP ? describe.skip : describe;

d('ServicesController (e2e)', () => {
    let app: INestApplication;
    let server: Parameters<typeof request>[0];
    let userRepo: Repository<User>;
    let serviceRepo: Repository<Service>;
    let token: string;
    let service: Service;

    beforeAll(async () => {
        process.env.JWT_SECRET = 'test-secret';
        process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                ConfigModule.forRoot({ isGlobal: true }),
                TypeOrmModule.forRoot({
                    type: 'sqlite',
                    database: ':memory:',
                    dropSchema: true,
                    entities: [User, Service],
                    synchronize: true,
                }),
                AuthModule,
                ServicesModule,
            ],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.use(cookieParser());
        await app.init();
        server = app.getHttpServer() as Parameters<typeof request>[0];

        userRepo = moduleFixture.get<Repository<User>>(
            getRepositoryToken(User),
        );
        serviceRepo = moduleFixture.get<Repository<Service>>(
            getRepositoryToken(Service),
        );

        const user = await userRepo.save({
            email: 'client@example.com',
            password: 'pass',
            name: 'Client',
            role: 'client',
            commissionBase: 0,
        });
        service = await serviceRepo.save({
            name: 'Cut',
            description: 'Hair cut',
            duration: 60,
            price: 100,
            commissionPercent: 10,
        });

        token = jwt.sign(
            { sub: user.id, role: 'client' },
            process.env.JWT_SECRET ?? '',
        );
    });

    afterAll(async () => {
        await app.close();
    });

    it('rejects unauthenticated access', async () => {
        await request(server).get('/services').expect(401);
    });

    it('returns all services for authenticated users', async () => {
        const res = await request(server)
            .get('/services')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);
        expect(res.body).toHaveLength(1);
        expect(res.body[0].id).toBe(service.id);
    });

    it('returns a service by id for authenticated users', async () => {
        const res = await request(server)
            .get(`/services/${service.id}`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200);
        expect(res.body.id).toBe(service.id);
    });
});
