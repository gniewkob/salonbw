import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { v4 as uuid } from 'uuid';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ServicesModule } from './services/services.module';
import { ProductsModule } from './products/products.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { FormulasModule } from './formulas/formulas.module';
import { CommissionsModule } from './commissions/commissions.module';
import { LogsModule } from './logs/logs.module';
import { ChatModule } from './chat/chat.module';
import { NotificationsModule } from './notifications/notifications.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { EmailsModule } from './emails/emails.module';
import { ObservabilityModule } from './observability/observability.module';
import { RetailModule } from './retail/retail.module';

@Module({
    imports: [
        LoggerModule.forRoot({
            renameContext: 'component',
            pinoHttp: {
                level: process.env.LOG_LEVEL ?? 'info',
                autoLogging: {
                    ignore: (req) => req.url === '/metrics',
                },
                customProps: (req) => ({
                    requestId: req.id,
                }),
                genReqId: (req, res) => {
                    const header = req.headers['x-request-id'];
                    const value = Array.isArray(header) ? header[0] : header;
                    const requestId =
                        value && typeof value === 'string' ? value : uuid();
                    res.setHeader('x-request-id', requestId);
                    return requestId;
                },
                customLogLevel: (req, res, err) => {
                    if (err) {
                        return 'fatal';
                    }
                    if (res.statusCode >= 500) {
                        return 'error';
                    }
                    if (res.statusCode >= 400) {
                        return 'warn';
                    }
                    return 'info';
                },
                transport:
                    process.env.NODE_ENV !== 'production'
                        ? {
                              target: 'pino-pretty',
                              options: {
                                  singleLine: true,
                                  translateTime: 'SYS:standard',
                                  colorize: true,
                              },
                          }
                        : undefined,
            },
        }),
        ConfigModule.forRoot({ isGlobal: true }),
        ScheduleModule.forRoot(),
        TypeOrmModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                type: 'postgres',
                url: config.get<string>('DATABASE_URL'),
                autoLoadEntities: true,
                // NOTE: synchronize is convenient for development but
                // should be disabled in production where migrations are used.
                synchronize: config.get<string>('NODE_ENV') !== 'production',
                migrations: [__dirname + '/migrations/*{.ts,.js}'],
            }),
        }),
        UsersModule,
        AuthModule,
        ServicesModule,
        ProductsModule,
        AppointmentsModule,
        FormulasModule,
        CommissionsModule,
        LogsModule,
        ChatModule,
        NotificationsModule,
        DashboardModule,
        EmailsModule,
        ObservabilityModule,
        RetailModule,
    ],
    controllers: [AppController, HealthController],
    providers: [AppService, HealthService],
})
export class AppModule {}
