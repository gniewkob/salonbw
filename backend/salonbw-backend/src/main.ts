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
    const config = app.get(ConfigService);
    if (process.env.NODE_ENV !== 'production') {
        const swaggerConfig = new DocumentBuilder()
            .setTitle('SalonBW API')
            .setDescription('The SalonBW API description')
            .setVersion('1.0')
            .addBearerAuth()
            .build();
        const document = SwaggerModule.createDocument(app, swaggerConfig);
        SwaggerModule.setup('api/docs', app, document);
    }
    app.enableCors({
        origin: config.get<string>('FRONTEND_URL') ?? true,
        credentials: true,
    });
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
