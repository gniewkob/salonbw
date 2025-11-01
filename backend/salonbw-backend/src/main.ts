import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { LogService } from './logs/log.service';
import { AuthFailureFilter } from './logs/auth-failure.filter';
import { PinoLogger, LoggerErrorInterceptor } from 'nestjs-pino';
import { HttpMetricsInterceptor } from './observability/http-metrics.interceptor';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        bufferLogs: true,
    });
    const logger = await app.resolve(PinoLogger);

    const logService = app.get(LogService);
    app.useGlobalFilters(new AuthFailureFilter(logService, logger));
    const metricsInterceptor = await app.resolve(HttpMetricsInterceptor);
    app.useGlobalInterceptors(metricsInterceptor, new LoggerErrorInterceptor());
    app.useGlobalPipes(
        new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    app.use(cookieParser());
    app.use((req, res, next) => {
        const requestWithId = req as typeof req & { id?: string };
        if (requestWithId.id && !res.getHeader('x-request-id')) {
            res.setHeader('x-request-id', requestWithId.id);
        }
        next();
    });
    const config = app.get(ConfigService);
    const enableSwagger =
        config.get<string>('ENABLE_SWAGGER', 'false')?.toLowerCase() === 'true';
    const nodeEnv = config.get<string>('NODE_ENV', 'development');

    if (enableSwagger) {
        const swaggerConfig = new DocumentBuilder()
            .setTitle('SalonBW API')
            .setDescription('The SalonBW API description')
            .setVersion('1.0')
            .addBearerAuth()
            .build();
        const document = SwaggerModule.createDocument(app, swaggerConfig);
        SwaggerModule.setup('api/docs', app, document);
        if (nodeEnv === 'production') {
            logger.warn('Swagger enabled while NODE_ENV=production');
        }
    }
    const frontendRaw = config.get<string>('FRONTEND_URL');
    const parsedOrigins = new Set<string>();
    const invalidOrigins: string[] = [];
    if (frontendRaw) {
        for (const entry of frontendRaw.split(',')) {
            const trimmed = entry.trim();
            if (!trimmed) continue;
            try {
                const url = new URL(trimmed);
                parsedOrigins.add(url.origin);
            } catch {
                invalidOrigins.push(trimmed);
            }
        }
    }

    if (invalidOrigins.length > 0) {
        throw new Error(
            `Invalid FRONTEND_URL entries: ${invalidOrigins.join(', ')}`,
        );
    }

    if (nodeEnv === 'production' && parsedOrigins.size === 0) {
        throw new Error(
            'FRONTEND_URL environment variable is required in production',
        );
    }

    const cookieDomain = config.get<string>('COOKIE_DOMAIN');
    if (nodeEnv === 'production' && !cookieDomain) {
        throw new Error('COOKIE_DOMAIN environment variable must be set');
    }
    if (cookieDomain && cookieDomain.startsWith('.')) {
        logger.debug({ cookieDomain }, 'using shared cookie domain');
    }

    app.enableCors({
        origin: parsedOrigins.size
            ? (
                  origin: string | undefined,
                  callback: (err: Error | null, allow?: boolean) => void,
              ) => {
                  if (!origin || parsedOrigins.has(origin)) {
                      callback(null, true);
                  } else {
                      logger.warn(
                          { origin },
                          'rejected CORS request from unauthorized origin',
                      );
                      callback(new Error('Not allowed by CORS'));
              }
          }
            : true,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: [
            'Content-Type',
            'Authorization',
            'X-XSRF-TOKEN',
            'X-Request-Id',
        ],
        exposedHeaders: ['X-Request-Id'],
    });

    if (parsedOrigins.size > 0) {
        logger.info(
            { origins: Array.from(parsedOrigins.values()) },
            'configured CORS origins',
        );
    }

    process.on('uncaughtException', (error) => {
        logger.fatal({ err: error }, 'uncaught exception');
    });
    process.on('unhandledRejection', (reason) => {
        logger.fatal({ err: reason }, 'unhandled rejection');
    });
    logger.info('bootstrap start');
    const port = config.get<number>('PORT') ?? 3000;
    await app.listen(port);
    logger.info({ port }, 'bootstrap listening');
}
void bootstrap();
