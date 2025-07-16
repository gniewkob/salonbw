import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { LogsService } from './logs/logs.service';
import { LoggingExceptionFilter } from './logs/logging-exception.filter';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

    const logsService = app.get(LogsService);
    app.useGlobalFilters(new LoggingExceptionFilter(logsService));

    const configService = app.get(ConfigService);
    app.enableCors({ origin: configService.get<string>('FRONTEND_URL') });

    await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
