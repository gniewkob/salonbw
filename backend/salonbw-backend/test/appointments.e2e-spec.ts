/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import request, { type Response } from 'supertest';
import * as jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import { Repository } from 'typeorm';

import { AuthModule } from '../src/auth/auth.module';
import { AppointmentsModule } from '../src/appointments/appointments.module';
import { ServicesModule } from '../src/services/services.module';
import { FormulasModule } from '../src/formulas/formulas.module';
import { User } from '../src/users/user.entity';
import { Service } from '../src/services/service.entity';
import { Appointment } from '../src/appointments/appointment.entity';
import { Commission } from '../src/commissions/commission.entity';
import { Formula } from '../src/formulas/formula.entity';
import { Product } from '../src/products/product.entity';

interface AppointmentResponse {
    id: number;
    status: string;
}

interface AppointmentWithEmployee extends AppointmentResponse {
    employee: { id: number };
}

describe('Appointments integration', () => {
    let app: INestApplication;
    let server: Parameters<typeof request>[0];
    let userRepo: Repository<User>;
    let serviceRepo: Repository<Service>;
    let commissionRepo: Repository<Commission>;
    let formulaRepo: Repository<Formula>;
    let clientToken: string;
    let employeeToken: string;
    let otherEmployeeToken: string;
    let adminToken: string;
    let service: Service;
    let client: User;
    let employee: User;
    const hour = 60 * 60 * 1000;

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
                    entities: [
                        User,
                        Appointment,
                        Service,
                        Commission,
                        Formula,
                        Product,
                    ],
                    synchronize: true,
                }),
                AuthModule,
                ServicesModule,
                AppointmentsModule,
                FormulasModule,
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
        commissionRepo = moduleFixture.get<Repository<Commission>>(
            getRepositoryToken(Commission),
        );
        formulaRepo = moduleFixture.get<Repository<Formula>>(
            getRepositoryToken(Formula),
        );

        client = await userRepo.save({
            email: 'client@example.com',
            password: 'pass',
            name: 'Client',
            role: 'client',
        });
        employee = await userRepo.save({
            email: 'emp@example.com',
            password: 'pass',
            name: 'Emp',
            role: 'employee',
        });
        const otherEmployee = await userRepo.save({
            email: 'emp2@example.com',
            password: 'pass',
            name: 'Emp2',
            role: 'employee',
        });
        const admin = await userRepo.save({
            email: 'admin@example.com',
            password: 'pass',
            name: 'Admin',
            role: 'admin',
        });

        service = await serviceRepo.save({
            name: 'Cut',
            description: 'Hair cut',
            duration: 60,
            price: 100,
            commissionPercent: 10,
        });

        const jwtSecret = process.env.JWT_SECRET ?? '';
        clientToken = jwt.sign({ sub: client.id, role: 'client' }, jwtSecret);
        employeeToken = jwt.sign(
            { sub: employee.id, role: 'employee' },
            jwtSecret,
        );
        otherEmployeeToken = jwt.sign(
            { sub: otherEmployee.id, role: 'employee' },
            jwtSecret,
        );
        adminToken = jwt.sign({ sub: admin.id, role: 'admin' }, jwtSecret);
    });

    afterAll(async () => {
        await app.close();
    });

    it('allows clients and employees to create appointments when clientId is provided', async () => {
        const startBase = Date.now() + hour;
        const start = new Date(startBase).toISOString();
        const end = new Date(startBase + hour).toISOString();
        const res: Response = await request(server)
            .post('/appointments')
            .set('Authorization', `Bearer ${clientToken}`)
            .send({
                employeeId: employee.id,
                serviceId: service.id,
                startTime: start,
                endTime: end,
            })
            .expect(201);
        const {
            employee: { id },
            endTime: returnedEnd,
        } = res.body as AppointmentWithEmployee & { endTime: string };
        expect(id).toBe(employee.id);
        expect(returnedEnd).toBe(end);

        const empStartBase = Date.now() + 3 * hour;
        const empStart = new Date(empStartBase).toISOString();
        const empEnd = new Date(empStartBase + hour).toISOString();
        await request(server)
            .post('/appointments')
            .set('Authorization', `Bearer ${employeeToken}`)
            .send({
                employeeId: employee.id,
                serviceId: service.id,
                startTime: empStart,
                endTime: empEnd,
            })
            .expect(400);

        const empRes: Response = await request(server)
            .post('/appointments')
            .set('Authorization', `Bearer ${employeeToken}`)
            .send({
                employeeId: employee.id,
                clientId: client.id,
                serviceId: service.id,
                startTime: empStart,
            })
            .expect(201);
        const expectedEnd = new Date(
            empStartBase + service.duration * 60 * 1000,
        ).toISOString();
        expect((empRes.body as { endTime: string }).endTime).toBe(expectedEnd);
    });

    it('rejects appointments scheduled in the past', async () => {
        const pastStartBase = Date.now() - 2 * hour;
        const pastStart = new Date(pastStartBase).toISOString();
        const pastEnd = new Date(pastStartBase + hour).toISOString();
        await request(server)
            .post('/appointments')
            .set('Authorization', `Bearer ${clientToken}`)
            .send({
                employeeId: employee.id,
                serviceId: service.id,
                startTime: pastStart,
                endTime: pastEnd,
            })
            .expect(400);
    });

    it('detects scheduling conflicts for the same employee', async () => {
        const start1Base = Date.now() + 5 * hour;
        const start1 = new Date(start1Base).toISOString();
        const end1 = new Date(start1Base + hour).toISOString();
        await request(server)
            .post('/appointments')
            .set('Authorization', `Bearer ${clientToken}`)
            .send({
                employeeId: employee.id,
                serviceId: service.id,
                startTime: start1,
                endTime: end1,
            })
            .expect(201);

        const start2 = new Date(start1Base + 0.5 * hour).toISOString();
        const end2 = new Date(start1Base + 1.5 * hour).toISOString();
        await request(server)
            .post('/appointments')
            .set('Authorization', `Bearer ${clientToken}`)
            .send({
                employeeId: employee.id,
                serviceId: service.id,
                startTime: start2,
                endTime: end2,
            })
            .expect(409);
    });

    it('allows only assigned employees or admins to complete appointments and creates commissions', async () => {
        const startBase = Date.now() + 7 * hour;
        const start = new Date(startBase).toISOString();
        const end = new Date(startBase + hour).toISOString();
        const createRes: Response = await request(server)
            .post('/appointments')
            .set('Authorization', `Bearer ${clientToken}`)
            .send({
                employeeId: employee.id,
                serviceId: service.id,
                startTime: start,
                endTime: end,
            })
            .expect(201);
        const appointmentId = (createRes.body as AppointmentResponse).id;

        await request(server)
            .patch(`/appointments/${appointmentId}/complete`)
            .set('Authorization', `Bearer ${clientToken}`)
            .expect(403);

        await request(server)
            .patch(`/appointments/${appointmentId}/complete`)
            .set('Authorization', `Bearer ${otherEmployeeToken}`)
            .expect(403);

        const completeRes: Response = await request(server)
            .patch(`/appointments/${appointmentId}/complete`)
            .set('Authorization', `Bearer ${employeeToken}`)
            .expect(200);
        expect((completeRes.body as AppointmentResponse).status).toBe(
            'completed',
        );

        const commissions = await commissionRepo.find();
        expect(commissions).toHaveLength(1);
        expect(commissions[0].appointment!.id).toBe(appointmentId);
        expect(Number(commissions[0].amount)).toBeCloseTo(10);

        // Admin can also complete
        const start2Base = Date.now() + 9 * hour;
        const start2 = new Date(start2Base).toISOString();
        const end2 = new Date(start2Base + hour).toISOString();
        const createRes2: Response = await request(server)
            .post('/appointments')
            .set('Authorization', `Bearer ${clientToken}`)
            .send({
                employeeId: employee.id,
                serviceId: service.id,
                startTime: start2,
                endTime: end2,
            })
            .expect(201);
        const appointmentId2 = (createRes2.body as AppointmentResponse).id;

        const adminComplete: Response = await request(server)
            .patch(`/appointments/${appointmentId2}/complete`)
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200);
        expect((adminComplete.body as AppointmentResponse).status).toBe(
            'completed',
        );
    });

    it('restricts formula creation to employees or admins', async () => {
        const startBase = Date.now() + 11 * hour;
        const start = new Date(startBase).toISOString();
        const end = new Date(startBase + hour).toISOString();
        const createRes: Response = await request(server)
            .post('/appointments')
            .set('Authorization', `Bearer ${clientToken}`)
            .send({
                employeeId: employee.id,
                serviceId: service.id,
                startTime: start,
                endTime: end,
            })
            .expect(201);
        const appointmentId = (createRes.body as AppointmentResponse).id;

        await request(server)
            .patch(`/appointments/${appointmentId}/complete`)
            .set('Authorization', `Bearer ${employeeToken}`)
            .expect(200);

        await request(server)
            .post(`/formulas/appointments/${appointmentId}`)
            .set('Authorization', `Bearer ${clientToken}`)
            .send({ description: 'test', date: new Date().toISOString() })
            .expect(403);

        await request(server)
            .post(`/formulas/appointments/${appointmentId}`)
            .set('Authorization', `Bearer ${employeeToken}`)
            .send({ description: 'formula', date: new Date().toISOString() })
            .expect(201);

        const formulas = await formulaRepo.find();
        expect(formulas).toHaveLength(1);
        expect(formulas[0].appointment!.id).toBe(appointmentId);
    });
});
