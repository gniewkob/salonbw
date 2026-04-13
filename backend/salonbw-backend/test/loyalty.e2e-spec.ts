import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import * as jwt from 'jsonwebtoken';
import { Repository } from 'typeorm';

import { AuthModule } from '../src/auth/auth.module';
import { LoyaltyModule } from '../src/loyalty/loyalty.module';
import { AppointmentsModule } from '../src/appointments/appointments.module';
import { RetailModule } from '../src/retail/retail.module';
import { FinanceModule } from '../src/finance/finance.module';
import { User } from '../src/users/user.entity';
import { Role } from '../src/users/role.enum';
import { Appointment, AppointmentStatus } from '../src/appointments/appointment.entity';
import { LoyaltyProgram, LoyaltyReward } from '../src/loyalty/entities/loyalty.entity';
import { Service } from '../src/services/service.entity';
import { ALL_ENTITIES } from './test-entities';

describe('Loyalty (e2e)', () => {
    let app: INestApplication;
    let server: any;
    let userRepo: Repository<User>;
    let loyaltyRepo: Repository<LoyaltyProgram>;
    let rewardRepo: Repository<LoyaltyReward>;
    let serviceRepo: Repository<Service>;
    let appointmentRepo: Repository<Appointment>;
    
    let adminToken: string;
    let customer: User;
    let employee: User;
    let service: Service;

    beforeAll(async () => {
        process.env.JWT_SECRET = 'test-secret';
        process.env.NODE_ENV = 'test';

        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                ConfigModule.forRoot({ isGlobal: true }),
                LoggerModule.forRoot({ pinoHttp: { level: 'silent' } }),
                TypeOrmModule.forRoot({
                    type: 'sqlite',
                    database: ':memory:',
                    dropSchema: true,
                    entities: ALL_ENTITIES,
                    synchronize: true,
                }),
                AuthModule,
                FinanceModule,
                LoyaltyModule,
                AppointmentsModule,
                RetailModule,
            ],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.use(cookieParser());
        app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
        await app.init();
        server = app.getHttpServer();

        userRepo = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
        loyaltyRepo = moduleFixture.get<Repository<LoyaltyProgram>>(getRepositoryToken(LoyaltyProgram));
        rewardRepo = moduleFixture.get<Repository<LoyaltyReward>>(getRepositoryToken(LoyaltyReward));
        serviceRepo = moduleFixture.get<Repository<Service>>(getRepositoryToken(Service));
        appointmentRepo = moduleFixture.get<Repository<Appointment>>(getRepositoryToken(Appointment));

        const admin = await userRepo.save({
            email: 'admin@example.com',
            password: 'pass',
            name: 'Admin',
            role: Role.Admin,
            commissionBase: 0,
        });

        customer = await userRepo.save({
            email: 'customer@example.com',
            password: 'pass',
            name: 'Customer',
            role: Role.Customer,
            commissionBase: 0,
        });

        employee = await userRepo.save({
            email: 'employee@example.com',
            password: 'pass',
            name: 'Employee',
            role: Role.Employee,
            commissionBase: 0,
        });

        service = await serviceRepo.save({
            name: 'Test Service',
            duration: 60,
            price: 100,
            commissionPercent: 10,
        });

        adminToken = jwt.sign({ sub: admin.id, role: 'admin' }, 'test-secret');

        // Setup loyalty program
        await loyaltyRepo.save({
            name: 'Default Program',
            isActive: true,
            pointsPerCurrency: 1, // 1 point per 1 PLN
            currencyPerPoint: 0.1, // 10 points = 1 PLN
        });
    });

    afterAll(async () => {
        await app.close();
    });

    it('should earn points after appointment finalization', async () => {
        // 1. Create appointment
        const apt = await appointmentRepo.save({
            clientId: customer.id,
            employeeId: employee.id,
            serviceId: service.id,
            startTime: new Date(Date.now() + 86400000), // tomorrow
            endTime: new Date(Date.now() + 86400000 + 3600000),
            status: AppointmentStatus.Confirmed,
        });

        // 2. Finalize via POS
        await request(server)
            .post(`/appointments/${apt.id}/finalize`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                paymentMethod: 'cash',
                paidAmountCents: 20000,
            })
            .expect(201);

        // 3. Check points balance
        const res = await request(server)
            .get(`/loyalty/balance/${customer.id}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200);

        expect(Number(res.body.currentBalance)).toBe(200);
    });

    it('should allow reward redemption', async () => {
        // 1. Create a reward
        const reward = await rewardRepo.save({
            name: 'Discount Reward',
            pointsCost: 100,
            type: 'discount' as any,
            rewardValue: 5,
            isActive: true,
        });

        // 2. Redeem reward
        await request(server)
            .post(`/loyalty/redeem/${customer.id}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ rewardId: reward.id })
            .expect(201);

        // 3. Check new balance
        const res = await request(server)
            .get(`/loyalty/balance/${customer.id}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200);

        expect(Number(res.body.currentBalance)).toBe(100); // 200 - 100
    });
});
