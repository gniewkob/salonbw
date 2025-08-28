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
import { AppointmentsController } from './src/appointments/appointments.controller';
import { AppointmentsService } from './src/appointments/appointments.service';
import { ServicesController } from './src/services/services.controller';
import { ServicesService } from './src/services/services.service';
import { ProductsController } from './src/products/products.controller';
import { ProductsService } from './src/products/products.service';
import { AppointmentFormulasController } from './src/formulas/appointment-formulas.controller';
import { ClientFormulasController } from './src/formulas/client-formulas.controller';
import { FormulasService } from './src/formulas/formulas.service';
import { CommissionsController } from './src/commissions/commissions.controller';
import { CommissionsService } from './src/commissions/commissions.service';
import { LogService } from './src/logs/log.service';
import { DashboardController } from './src/dashboard/dashboard.controller';
import { DashboardService } from './src/dashboard/dashboard.service';

@Module({
    controllers: [
        AppController,
        HealthController,
        UsersController,
        AuthController,
        AppointmentsController,
        ServicesController,
        ProductsController,
        AppointmentFormulasController,
        ClientFormulasController,
        CommissionsController,
        DashboardController,
    ],
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
        {
            provide: AppointmentsService,
            useValue: {
                create: () => ({}),
                findForUser: () => [],
                findOne: () => ({}),
                cancel: () => ({}),
                completeAppointment: () => ({}),
            },
        },
        {
            provide: ServicesService,
            useValue: {
                create: () => ({}),
                findAll: () => [],
                findOne: () => ({}),
                update: () => ({}),
                remove: () => undefined,
            },
        },
        {
            provide: ProductsService,
            useValue: {
                create: () => ({}),
                findAll: () => [],
                findOne: () => ({}),
                update: () => ({}),
                remove: () => undefined,
            },
        },
        {
            provide: FormulasService,
            useValue: {
                addToAppointment: () => ({}),
                findForClient: () => [],
            },
        },
        {
            provide: CommissionsService,
            useValue: {
                findForUser: () => [],
                findAll: () => [],
            },
        },
        {
            provide: LogService,
            useValue: {
                logAction: () => undefined,
                findAll: () => ({ data: [], total: 0, page: 1, limit: 0 }),
            },
        },
        {
            provide: DashboardService,
            useValue: {
                getSummary: () => ({
                    clientCount: 0,
                    employeeCount: 0,
                    todayAppointments: 0,
                    upcomingAppointments: [],
                }),
            },
        },
    ],
})
class SwaggerAppModule {}

async function generate() {
    const app = await NestFactory.create(SwaggerAppModule, { logger: false });
    const config = new DocumentBuilder()
        .setTitle('SalonBW API')
        .setDescription('The SalonBW API description')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = SwaggerModule.createDocument(app, config);
    writeFileSync('openapi.json', JSON.stringify(document, null, 2) + '\n');
    await app.close();
}

void generate();
