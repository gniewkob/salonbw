import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.useGlobalPipes(
        new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    app.use(cookieParser());
    const config = app.get(ConfigService);
    app.enableCors({
        origin: config.get<string>('FRONTEND_URL'),
        credentials: true,
    });
    await app.listen(config.get<number>('PORT') ?? 3000);
}
void bootstrap();
