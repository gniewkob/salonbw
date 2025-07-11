import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    const configService = app.get(ConfigService);
    app.enableCors({ origin: configService.get<string>('FRONTEND_URL') });

    await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
