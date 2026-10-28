/**
 * HTTP contract for POST /appointments.
 *
 * The Nest controller, real JWT Passport strategy, role guard and validation
 * pipe execute in-process. Credentials, users and persistence are synthetic.
 * No MyDevil connection, external HTTP calls or appointment DB writes.
 *
 * Separate isolated-Postgres tests assert the 403/409 service behavior.
 * Do not claim this file tests hosted DEV authentication or persisted races.
 */
import {
    INestApplication,
    ValidationPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { Test } from '@nestjs/testing';
import { sign } from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { JwtStrategy } from '../auth/jwt.strategy';
import { RolesGuard } from '../auth/roles.guard';
import { UsersService } from '../users/users.service';
import { Role } from '../users/role.enum';

const HTTP_TEST_JWT_SECRET = 'local-uat-http-fixture-secret-not-for-runtime';
const accounts = [
    { id: 101, role: Role.Client, authVersion: 0 },
    { id: 102, role: Role.Employee, authVersion: 0 },
    { id: 103, role: Role.Receptionist, authVersion: 0 },
    { id: 104, role: Role.Admin, authVersion: 0 },
] as const;

const createBooking = {
    clientId: 101,
    employeeId: 102,
    serviceId: 201,
    startTime: '2026-11-04T08:00:00.000Z',
};

function tokenFor(id: number, role?: Role, authVersion = 0): string {
    const actor = accounts.find((account) => account.id === id);
    if (!actor) throw new Error('Unknown synthetic HTTP actor');
    return sign(
        {
            sub: actor.id,
            role: role ?? actor.role,
            authVersion,
        },
        HTTP_TEST_JWT_SECRET,
        { expiresIn: '5m' },
    );
}

describe('POST /appointments HTTP authorization boundary (isolated)', () => {
    let app: INestApplication;
    const create = jest.fn();

    beforeAll(async () => {
        const module = await Test.createTestingModule({
            imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
            controllers: [AppointmentsController],
            providers: [
                JwtStrategy,
                RolesGuard,
                {
                    provide: ConfigService,
                    useValue: {
                        get: (key: string) =>
                            key === 'JWT_SECRET'
                                ? HTTP_TEST_JWT_SECRET
                                : undefined,
                    },
                },
                {
                    provide: UsersService,
                    useValue: {
                        findAuthStateById: async (id: number) =>
                            accounts.find((actor) => actor.id === id) ?? null,
                    },
                },
                {
                    provide: AppointmentsService,
                    useValue: { create },
                },
            ],
        }).compile();

        app = module.createNestApplication();
        // Match the production cookie-parser middleware: Passport must be
        // able to extract the namespaced JWT from a cookie alongside DEV Basic.
        app.use(cookieParser());
        app.useGlobalPipes(
            new ValidationPipe({
                transform: true,
                whitelist: true,
                forbidNonWhitelisted: true,
            }),
        );
        await app.init();
    });

    afterEach(() => {
        create.mockReset();
    });

    afterAll(async () => {
        if (app) await app.close();
    });

    it('returns 401 without a signed JWT and never invokes the booking service', async () => {
        await request(app.getHttpServer())
            .post('/appointments')
            .send({ ...createBooking, forceOverlap: true })
            .expect(401);
        expect(create).not.toHaveBeenCalled();
    });

    it('separates DEV Basic gateway credentials from a namespaced JWT cookie', async () => {
        // This is an isolated Nest HTTP contract, not a request to MyDevil.
        // A Basic Authorization header is NOT a bearer token. Passport must
        // fall back to the namespaced cookie while retaining role guards.
        const priorPrefix = process.env.AUTH_COOKIE_PREFIX;
        process.env.AUTH_COOKIE_PREFIX = 'uat_';
        try {
            const basic = 'Basic ' + Buffer.from('synthetic:gateway').toString('base64');
            const payload = { ...createBooking, forceOverlap: true };

            await request(app.getHttpServer())
                .post('/appointments')
                .set('Authorization', basic)
                .send(payload)
                .expect(401);

            await request(app.getHttpServer())
                .post('/appointments')
                .set('Authorization', basic)
                .set('Cookie', 'accessToken=' + tokenFor(101))
                .send(payload)
                .expect(401);

            await request(app.getHttpServer())
                .post('/appointments')
                .set('Authorization', basic)
                .set('Cookie', 'uat_accessToken=' + tokenFor(101))
                .send(payload)
                .expect(403);

            expect(create).not.toHaveBeenCalled();
        } finally {
            if (priorPrefix === undefined) {
                delete process.env.AUTH_COOKIE_PREFIX;
            } else {
                process.env.AUTH_COOKIE_PREFIX = priorPrefix;
            }
        }
    });

    it('returns 401 when JWT role differs from current account role', async () => {
        await request(app.getHttpServer())
            .post('/appointments')
            .set('Authorization', 'Bearer ' + tokenFor(101, Role.Admin))
            .send({ ...createBooking, forceOverlap: true })
            .expect(401);
        expect(create).not.toHaveBeenCalled();
    });

    it('returns 401 after the account authorization version changes', async () => {
        await request(app.getHttpServer())
            .post('/appointments')
            .set('Authorization', 'Bearer ' + tokenFor(104, undefined, 1))
            .send({ ...createBooking, forceOverlap: true })
            .expect(401);
        expect(create).not.toHaveBeenCalled();
    });

    it.each([
        ['client', 101, Role.Client],
        ['employee', 102, Role.Employee],
        ['receptionist', 103, Role.Receptionist],
    ] as const)(
        'returns 403 for %s forceOverlap and prevents service invocation',
        async (_label, id) => {
            const response = await request(app.getHttpServer())
                .post('/appointments')
                .set('Authorization', 'Bearer ' + tokenFor(id))
                .send({ ...createBooking, forceOverlap: true })
                .expect(403);

            expect(response.body.statusCode).toBe(403);
            expect(create).not.toHaveBeenCalled();
        },
    );

    it('blocks an employee from creating a booking for a different employee', async () => {
        await request(app.getHttpServer())
            .post('/appointments')
            .set('Authorization', 'Bearer ' + tokenFor(102))
            .send({
                ...createBooking,
                employeeId: 999,
                forceOverlap: false,
            })
            .expect(403);
        expect(create).not.toHaveBeenCalled();
    });

    it('rejects a non-boolean forceOverlap payload with 400 before service execution', async () => {
        await request(app.getHttpServer())
            .post('/appointments')
            .set('Authorization', 'Bearer ' + tokenFor(104))
            .send({ ...createBooking, forceOverlap: 'true' })
            .expect(400);
        expect(create).not.toHaveBeenCalled();
    });

    it('routes a valid administrator override exactly once and preserves UTC start', async () => {
        create.mockResolvedValueOnce({ id: 990001 });
        const response = await request(app.getHttpServer())
            .post('/appointments')
            .set('Authorization', 'Bearer ' + tokenFor(104))
            .send({ ...createBooking, forceOverlap: true })
            .expect(201);

        expect(response.body).toEqual({ id: 990001 });
        expect(create).toHaveBeenCalledTimes(1);
        expect(create).toHaveBeenCalledWith(
            expect.objectContaining({
                client: { id: 101 },
                employee: { id: 102 },
                service: { id: 201 },
                startTime: new Date('2026-11-04T08:00:00.000Z'),
            }),
            expect.objectContaining({ id: 104, role: Role.Admin }),
            true,
        );
    });

    it('does not enable overlap for ordinary admin booking without explicit consent', async () => {
        create.mockResolvedValueOnce({ id: 990002 });
        await request(app.getHttpServer())
            .post('/appointments')
            .set('Authorization', 'Bearer ' + tokenFor(104))
            .send({ ...createBooking })
            .expect(201);

        expect(create).toHaveBeenCalledTimes(1);
        expect(create).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({ id: 104, role: Role.Admin }),
            false,
        );
    });
});
