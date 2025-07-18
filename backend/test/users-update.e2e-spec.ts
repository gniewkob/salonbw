import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { Response } from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { UsersService } from './../src/users/users.service';
import { AuthService } from './../src/auth/auth.service';
import { Role } from './../src/users/role.enum';
import { EmployeeRole } from './../src/employees/employee-role.enum';

describe('Customer update (e2e)', () => {
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

    it('allows admin to update customer', async () => {
        await usersService.createUser(
            'admupd@test.com',
            'secret',
            'A',
            Role.Admin,
        );
        const client = await usersService.createUser(
            'custupd@test.com',
            'secret',
            'C',
            Role.Client,
        );

        const login: Response = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'admupd@test.com', password: 'secret' })
            .expect(201);

        const token = (login.body as { access_token: string }).access_token;

        await request(app.getHttpServer())
            .patch(`/users/customers/${client.id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Updated' })
            .expect(200)
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            .expect((res) => expect(res.body.name).toBe('Updated'));
    });

    it('allows reception role to update customer', async () => {
        const reception = await usersService.createUser(
            'recupd@test.com',
            'secret',
            'R',
            Role.Employee,
        );
        const client = await usersService.createUser(
            'custrec@test.com',
            'secret',
            'C',
            Role.Client,
        );

        const tokens: AuthTokensDto = await authService.generateTokens(
            reception.id,
            EmployeeRole.RECEPCJA,
        );
        const token = tokens.access_token;

        await request(app.getHttpServer())
            .patch(`/users/customers/${client.id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'New' })
            .expect(200);
    });

    it('rejects other roles updating customer', async () => {
        await usersService.createUser(
            'empupd@test.com',
            'secret',
            'E',
            Role.Employee,
        );
        const client = await usersService.createUser(
            'custfail@test.com',
            'secret',
            'C',
            Role.Client,
        );

        const login: Response = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'empupd@test.com', password: 'secret' })
            .expect(201);

        const token = (login.body as { access_token: string }).access_token;

        await request(app.getHttpServer())
            .patch(`/users/customers/${client.id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Fail' })
            .expect(403);
    });
});
