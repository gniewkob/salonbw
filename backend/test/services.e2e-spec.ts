import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { UsersService } from './../src/users/users.service';
import { Role } from './../src/users/role.enum';

describe('ServicesModule (e2e)', () => {
  let app: INestApplication<App>;
  let users: UsersService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
    users = moduleFixture.get(UsersService);
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

  it('returns 404 when deleting missing service', async () => {
    await users.createUser('admin@services.com', 'secret', 'Admin', Role.Admin);

    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@services.com', password: 'secret' })
      .expect(201);
    const token = login.body.access_token;

    await request(app.getHttpServer())
      .delete('/services/9999')
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  it('responds 404 for deleting a nonexistent service', async () => {
    await users.createUser('otheradmin@services.com', 'secret', 'Admin', Role.Admin);

    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'otheradmin@services.com', password: 'secret' })
      .expect(201);
    const token = login.body.access_token;

    await request(app.getHttpServer())
      .delete('/services/8888')
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });
});
