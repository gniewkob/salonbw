import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import { v4 as uuid } from 'uuid';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule, type TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import type { LoggerOptions } from 'typeorm';
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
import { CSPModule } from './csp/csp.module';
import { CacheModule } from './cache/cache.module';
import { DatabaseSlowQueryService } from './database/database-slow-query.service';
import { InvoicesModule } from './invoices/invoices.module';
import { ReviewsModule } from './reviews/reviews.module';
import { CalendarModule } from './calendar/calendar.module';
import { CustomersModule } from './customers/customers.module';
import { WarehouseModule } from './warehouse/warehouse.module';
import { TimetablesModule } from './timetables/timetables.module';
import { SmsModule } from './sms/sms.module';
import { StatisticsModule } from './statistics/statistics.module';
import { AutomaticMessagesModule } from './automatic-messages/automatic-messages.module';
import { NewslettersModule } from './newsletters/newsletters.module';
import { SettingsModule } from './settings/settings.module';
import { BranchesModule } from './branches/branches.module';
import { GiftCardsModule } from './gift-cards/gift-cards.module';
import { LoyaltyModule } from './loyalty/loyalty.module';
import { VersumCompatModule } from './versum-compat/versum-compat.module';

@Module({
    imports: [
        ThrottlerModule.forRootAsync({
            inject: [ConfigService],
            useFactory: createThrottlerConfig,
        }),
        LoggerModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                renameContext: 'component',
                pinoHttp: {
                    level: config.get('PINO_LOG_LEVEL', 'info'),
                    autoLogging: {
                        ignore: (req) => req.url === '/metrics',
                    },
                    customProps: (req) => ({
                        requestId: req.id,
                    }),
                    genReqId: (req, res) => {
                        const header = req.headers['x-request-id'];
                        const value = Array.isArray(header)
                            ? header[0]
                            : header;
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
                    transport: resolvePinoTransport(config),
                },
            }),
        }),
        ConfigModule.forRoot({ isGlobal: true }),
        CacheModule,
        ScheduleModule.forRoot(),
        TypeOrmModule.forRootAsync({
            inject: [ConfigService],
            useFactory: createTypeOrmConfig,
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
        CSPModule,
        InvoicesModule,
        ReviewsModule,
        CalendarModule,
        CustomersModule,
        WarehouseModule,
        TimetablesModule,
        SmsModule,
        StatisticsModule,
        AutomaticMessagesModule,
        NewslettersModule,
        SettingsModule,
        BranchesModule,
        GiftCardsModule,
        LoyaltyModule,
        VersumCompatModule,
    ],
    controllers: [AppController, HealthController],
    providers: [
        AppService,
        HealthService,
        DatabaseSlowQueryService,
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
    ],
})
export class AppModule {}

function resolvePinoTransport(config: ConfigService) {
    const nodeEnv = config.get<string>('NODE_ENV', 'development');
    if (nodeEnv !== 'production') {
        return {
            target: 'pino-pretty',
            options: {
                singleLine: true,
                translateTime: 'SYS:standard',
                colorize: true,
            },
        };
    }

    const lokiUrl = config.get<string>('LOKI_URL');
    if (!lokiUrl) {
        return undefined;
    }

    return {
        target: './logs/loki.transport',
        options: {
            lokiUrl,
            basicAuth: config.get<string>('LOKI_BASIC_AUTH'),
            service: config.get<string>('SERVICE_NAME', 'salonbw-backend'),
            environment: nodeEnv,
        },
    };
}

function createThrottlerConfig(config: ConfigService) {
    const ttl = asPositiveNumber(
        config.get<string>('THROTTLE_TTL', '60000'),
        'THROTTLE_TTL',
    );
    const limit = asPositiveNumber(
        config.get<string>('THROTTLE_LIMIT', '10'),
        'THROTTLE_LIMIT',
    );
    return [{ ttl, limit }];
}

function createTypeOrmConfig(config: ConfigService): TypeOrmModuleOptions {
    const dbUrl = config.get<string>('DATABASE_URL');
    const shouldSync =
        config.get<string>('DB_SYNCHRONIZE', 'false').toLowerCase() === 'true';
    const nodeEnv = config.get<string>('NODE_ENV', 'development');

    if (nodeEnv === 'production' && shouldSync) {
        throw new Error(
            'DB_SYNCHRONIZE must be false in production for safety',
        );
    }

    if (!dbUrl) {
        throw new Error('DATABASE_URL environment variable is required');
    }

    const poolSize = config.get<number>('DB_POOL_SIZE', 10);
    const poolMin = config.get<number>('DB_POOL_MIN', 2);
    const idleTimeoutMillis = config.get<number>('DB_IDLE_TIMEOUT_MS', 30000);
    const connectionTimeoutMillis = config.get<number>(
        'DB_CONNECTION_TIMEOUT_MS',
        5000,
    );

    const logging: LoggerOptions =
        nodeEnv === 'development'
            ? ['error', 'warn', 'query']
            : ['error', 'warn'];

    return {
        type: 'postgres' as const,
        url: dbUrl,
        autoLoadEntities: true,
        synchronize: shouldSync,
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        extra: {
            max: poolSize,
            min: poolMin,
            idleTimeoutMillis,
            connectionTimeoutMillis,
            statement_timeout: 30000,
            query_timeout: 30000,
        },
        logging,
        maxQueryExecutionTime: nodeEnv === 'development' ? 1000 : undefined,
        cache: {
            duration: 30000,
            type: 'database',
        } as const,
    };
}

function asPositiveNumber(raw: string, key: string) {
    const value = Number(raw);
    if (!Number.isFinite(value) || value <= 0) {
        throw new Error(`${key} must be a positive number`);
    }
    return value;
}
