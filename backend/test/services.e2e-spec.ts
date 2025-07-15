import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { UsersService } from './../src/users/users.service';
import { Role } from './../src/users/role.enum';

describe('ServicesModule (e2e)', () => {
  let app: INestApplication<App>;
  let usersService: UsersService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
    usersService = moduleFixture.get(UsersService);
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('rejects client creating a service', async () => {
    const register = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'client@services.com', password: 'secret', name: 'Client' })
      .expect(201);
    const token = register.body.access_token;

    await request(app.getHttpServer())
      .post('/services')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'cut', duration: 30, price: 10 })
      .expect(403);
  });

  it('fails to delete service with appointments', async () => {
    const client = await usersService.createUser('svcclient@test.com', 'secret', 'C', Role.Client);
    const employee = await usersService.createUser('svcemp@test.com', 'secret', 'E', Role.Employee);
    await usersService.createUser('svcadmin@test.com', 'secret', 'A', Role.Admin);

    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'svcadmin@test.com', password: 'secret' })
      .expect(201);
    const token = login.body.access_token;

    const future = new Date(Date.now() + 3600 * 1000).toISOString();
    await request(app.getHttpServer())
      .post('/appointments/admin')
      .set('Authorization', `Bearer ${token}`)
      .send({ clientId: client.id, employeeId: employee.id, serviceId: 1, startTime: future })
      .expect(201);

    await request(app.getHttpServer())
      .delete('/services/1')
      .set('Authorization', `Bearer ${token}`)
      .expect(400);
  });
});
