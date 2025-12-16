"use strict";
var __decorate =
    (this && this.__decorate) ||
    function (decorators, target, key, desc) {
        var c = arguments.length,
            r =
                c < 3
                    ? target
                    : desc === null
                    ? (desc = Object.getOwnPropertyDescriptor(target, key))
                    : desc,
            d;
        if (
            typeof Reflect === "object" &&
            typeof Reflect.decorate === "function"
        )
            r = Reflect.decorate(decorators, target, key, desc);
        else
            for (var i = decorators.length - 1; i >= 0; i--)
                if ((d = decorators[i]))
                    r =
                        (c < 3
                            ? d(r)
                            : c > 3
                            ? d(target, key, r)
                            : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const nestjs_pino_1 = require("nestjs-pino");
const uuid_1 = require("uuid");
const config_1 = require("@nestjs/config");
const schedule_1 = require("@nestjs/schedule");
const typeorm_1 = require("@nestjs/typeorm");
const throttler_1 = require("@nestjs/throttler");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const health_controller_1 = require("./health.controller");
const health_service_1 = require("./health.service");
const users_module_1 = require("./users/users.module");
const auth_module_1 = require("./auth/auth.module");
const services_module_1 = require("./services/services.module");
const products_module_1 = require("./products/products.module");
const appointments_module_1 = require("./appointments/appointments.module");
const formulas_module_1 = require("./formulas/formulas.module");
const commissions_module_1 = require("./commissions/commissions.module");
const logs_module_1 = require("./logs/logs.module");
const chat_module_1 = require("./chat/chat.module");
const notifications_module_1 = require("./notifications/notifications.module");
const dashboard_module_1 = require("./dashboard/dashboard.module");
const emails_module_1 = require("./emails/emails.module");
const observability_module_1 = require("./observability/observability.module");
const retail_module_1 = require("./retail/retail.module");
const csp_module_1 = require("./csp/csp.module");
const cache_module_1 = require("./cache/cache.module");
const database_slow_query_service_1 = require("./database/database-slow-query.service");
let AppModule = class AppModule {};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate(
    [
        (0, common_1.Module)({
            imports: [
                throttler_1.ThrottlerModule.forRootAsync({
                    inject: [config_1.ConfigService],
                    useFactory: createThrottlerConfig,
                }),
                nestjs_pino_1.LoggerModule.forRootAsync({
                    inject: [config_1.ConfigService],
                    useFactory: (config) => ({
                        renameContext: "component",
                        pinoHttp: {
                            level: config.get("PINO_LOG_LEVEL", "info"),
                            autoLogging: {
                                ignore: (req) => req.url === "/metrics",
                            },
                            customProps: (req) => ({
                                requestId: req.id,
                            }),
                            genReqId: (req, res) => {
                                const header = req.headers["x-request-id"];
                                const value = Array.isArray(header)
                                    ? header[0]
                                    : header;
                                const requestId =
                                    value && typeof value === "string"
                                        ? value
                                        : (0, uuid_1.v4)();
                                res.setHeader("x-request-id", requestId);
                                return requestId;
                            },
                            customLogLevel: (req, res, err) => {
                                if (err) {
                                    return "fatal";
                                }
                                if (res.statusCode >= 500) {
                                    return "error";
                                }
                                if (res.statusCode >= 400) {
                                    return "warn";
                                }
                                return "info";
                            },
                            transport: resolvePinoTransport(config),
                        },
                    }),
                }),
                config_1.ConfigModule.forRoot({ isGlobal: true }),
                cache_module_1.CacheModule,
                schedule_1.ScheduleModule.forRoot(),
                typeorm_1.TypeOrmModule.forRootAsync({
                    inject: [config_1.ConfigService],
                    useFactory: createTypeOrmConfig,
                }),
                users_module_1.UsersModule,
                auth_module_1.AuthModule,
                services_module_1.ServicesModule,
                products_module_1.ProductsModule,
                appointments_module_1.AppointmentsModule,
                formulas_module_1.FormulasModule,
                commissions_module_1.CommissionsModule,
                logs_module_1.LogsModule,
                chat_module_1.ChatModule,
                notifications_module_1.NotificationsModule,
                dashboard_module_1.DashboardModule,
                emails_module_1.EmailsModule,
                observability_module_1.ObservabilityModule,
                retail_module_1.RetailModule,
                csp_module_1.CSPModule,
            ],
            controllers: [
                app_controller_1.AppController,
                health_controller_1.HealthController,
            ],
            providers: [
                app_service_1.AppService,
                health_service_1.HealthService,
                database_slow_query_service_1.DatabaseSlowQueryService,
                {
                    provide: core_1.APP_GUARD,
                    useClass: throttler_1.ThrottlerGuard,
                },
            ],
        }),
    ],
    AppModule
);
function resolvePinoTransport(config) {
    const nodeEnv = config.get("NODE_ENV", "development");
    if (nodeEnv !== "production") {
        return {
            target: "pino-pretty",
            options: {
                singleLine: true,
                translateTime: "SYS:standard",
                colorize: true,
            },
        };
    }
    const lokiUrl = config.get("LOKI_URL");
    if (!lokiUrl) {
        return undefined;
    }
    return {
        target: "./logs/loki.transport",
        options: {
            lokiUrl,
            basicAuth: config.get("LOKI_BASIC_AUTH"),
            service: config.get("SERVICE_NAME", "salonbw-backend"),
            environment: nodeEnv,
        },
    };
}
function createThrottlerConfig(config) {
    const ttl = asPositiveNumber(
        config.get("THROTTLE_TTL", "60000"),
        "THROTTLE_TTL"
    );
    const limit = asPositiveNumber(
        config.get("THROTTLE_LIMIT", "10"),
        "THROTTLE_LIMIT"
    );
    return [{ ttl, limit }];
}
function createTypeOrmConfig(config) {
    const dbUrl = config.get("DATABASE_URL");
    const shouldSync =
        config.get("DB_SYNCHRONIZE", "false").toLowerCase() === "true";
    const nodeEnv = config.get("NODE_ENV", "development");
    if (nodeEnv === "production" && shouldSync) {
        throw new Error(
            "DB_SYNCHRONIZE must be false in production for safety"
        );
    }
    // HOT PATCH: Allow missing DATABASE_URL if other params are present
    const host = config.get("PGHOST");
    const username = config.get("PGUSER");
    const password = config.get("PGPASSWORD");
    const database = config.get("PGDATABASE");
    const port = config.get("PGPORT") ? parseInt(config.get("PGPORT")) : 5432;

    if (!dbUrl && (!host || !username || !password || !database)) {
        throw new Error(
            "DATABASE_URL or PG* environment variables are required"
        );
    }

    const poolSize = config.get("DB_POOL_SIZE", 10);
    const poolMin = config.get("DB_POOL_MIN", 2);
    const idleTimeoutMillis = config.get("DB_IDLE_TIMEOUT_MS", 30000);
    const connectionTimeoutMillis = config.get(
        "DB_CONNECTION_TIMEOUT_MS",
        5000
    );
    const logging =
        nodeEnv === "development"
            ? ["error", "warn", "query"]
            : ["error", "warn"];
    return {
        type: "postgres",
        url: dbUrl, // Can be undefined
        host,
        port,
        username,
        password,
        database,
        autoLoadEntities: true,
        synchronize: shouldSync,
        migrations: [__dirname + "/migrations/*{.ts,.js}"],
        extra: {
            max: poolSize,
            min: poolMin,
            idleTimeoutMillis,
            connectionTimeoutMillis,
            statement_timeout: 30000,
            query_timeout: 30000,
        },
        logging,
        maxQueryExecutionTime: nodeEnv === "development" ? 1000 : undefined,
        cache: {
            duration: 30000,
            type: "database",
        },
    };
}
function asPositiveNumber(raw, key) {
    const value = Number(raw);
    if (!Number.isFinite(value) || value <= 0) {
        throw new Error(`${key} must be a positive number`);
    }
    return value;
}
//# sourceMappingURL=app.module.js.map
