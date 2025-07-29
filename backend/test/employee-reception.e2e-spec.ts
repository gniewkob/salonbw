import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { UsersService } from './../src/users/users.service';
import { AuthService } from './../src/auth/auth.service';
import { Role } from './../src/users/role.enum';
import { EmployeeRole } from './../src/employees/employee-role.enum';

describe('Reception role restrictions (e2e)', () => {
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

    it('rejects FRYZJER accessing reception-only endpoint', async () => {
        const employee = await usersService.createUser(
            'fry@test.com',
            'secret',
            'F',
            Role.Employee,
        );
        const client = await usersService.createUser(
            'clientf@test.com',
            'secret',
            'C',
            Role.Client,
        );

        const tokens = await authService.generateTokens(
            employee.id,
            EmployeeRole.FRYZJER,
        );
        const token = tokens.access_token;

        await request(app.getHttpServer())
            .patch(`/users/customers/${client.id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Nope' })
            .expect(403);
    });

    it('allows RECEPTIONIST employee to update customer', async () => {
        const reception = await usersService.createUser(
            'rec@test.com',
            'secret',
            'R',
            Role.Employee,
        );
        const client = await usersService.createUser(
            'clientr@test.com',
            'secret',
            'C',
            Role.Client,
        );

        const tokens = await authService.generateTokens(
            reception.id,
            EmployeeRole.RECEPTIONIST,
        );
        const token = tokens.access_token;

        await request(app.getHttpServer())
            .patch(`/users/customers/${client.id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Ok' })
            .expect(200);
    });

    it('allows admin user to update customer', async () => {
        await usersService.createUser(
            'adminr@test.com',
            'secret',
            'A',
            Role.Admin,
        );
        const client = await usersService.createUser(
            'clienta@test.com',
            'secret',
            'C',
            Role.Client,
        );

        const login = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'adminr@test.com', password: 'secret' })
            .expect(201);
        const token = login.body.access_token;

        await request(app.getHttpServer())
            .patch(`/users/customers/${client.id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Admin' })
            .expect(200);
    });
});
