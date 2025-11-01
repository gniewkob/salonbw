import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import { v4 as uuid } from 'uuid';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
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
        ThrottlerModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
                const ttlRaw = config.get<string>('THROTTLE_TTL', '60000');
                const limitRaw = config.get<string>('THROTTLE_LIMIT', '10');
                const ttl = Number(ttlRaw);
                const limit = Number(limitRaw);
                if (!Number.isFinite(ttl) || ttl <= 0) {
                    throw new Error('THROTTLE_TTL must be a positive number');
                }
                if (!Number.isFinite(limit) || limit <= 0) {
                    throw new Error('THROTTLE_LIMIT must be a positive number');
                }
                return [
                    {
                        ttl,
                        limit,
                    },
                ];
            },
        }),
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
            useFactory: (config: ConfigService) => {
                const dbUrl = config.get<string>('DATABASE_URL');
                const shouldSync =
                    config
                        .get<string>('DB_SYNCHRONIZE', 'false')
                        .toLowerCase() === 'true';
                const nodeEnv = config.get<string>('NODE_ENV', 'development');

                if (nodeEnv === 'production' && shouldSync) {
                    throw new Error(
                        'DB_SYNCHRONIZE must be false in production for safety',
                    );
                }

                if (!dbUrl) {
                    throw new Error(
                        'DATABASE_URL environment variable is required',
                    );
                }

                return {
                    type: 'postgres',
                    url: dbUrl,
                    autoLoadEntities: true,
                    synchronize: shouldSync,
                    migrations: [__dirname + '/migrations/*{.ts,.js}'],
                };
            },
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
    providers: [
        AppService,
        HealthService,
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
    ],
})
export class AppModule {}
