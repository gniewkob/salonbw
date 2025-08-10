import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { writeFileSync } from 'node:fs';
import { Module } from '@nestjs/common';
import { AppController } from './src/app.controller';
import { AppService } from './src/app.service';
import { HealthController } from './src/health.controller';
import { UsersController } from './src/users/users.controller';
import { UsersService } from './src/users/users.service';
import { AuthController } from './src/auth/auth.controller';
import { AuthService } from './src/auth/auth.service';

@Module({
  controllers: [AppController, HealthController, UsersController, AuthController],
  providers: [
    AppService,
    {
      provide: UsersService,
      useValue: {
        findByEmail: async () => null,
        findById: async () => ({ id: 0, role: 'Client' }),
        createUser: async () => ({ id: 0, role: 'Client' }),
      },
    },
    {
      provide: AuthService,
      useValue: {
        login: () => ({}),
        refresh: () => ({}),
      },
    },
  ],
})
class SwaggerAppModule {}

async function generate() {
  const app = await NestFactory.create(SwaggerAppModule, { logger: false });
  const config = new DocumentBuilder()
    .setTitle('SalonBW API')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  writeFileSync('openapi.json', JSON.stringify(document, null, 2) + '\n');
  await app.close();
}

void generate();
