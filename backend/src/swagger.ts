import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { writeFileSync } from 'fs';
import { getMetadataArgsStorage } from 'typeorm';

@Module({
    imports: [ConfigModule.forRoot({ envFilePath: '.env', isGlobal: true }), AppModule],
})
class SwaggerAppModule {}

async function generateOpenApi() {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'temp';
    process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'temp';
    process.env.DATABASE_URL = process.env.DATABASE_URL || 'sqlite::memory:';

    const storage = getMetadataArgsStorage();
    storage.columns.forEach((col) => {
        if (col.options.type === 'timestamptz') {
            col.options.type = 'datetime';
        }
        if (col.options.type === 'enum') {
            col.options.type = 'simple-enum';
        }
    });

    const app = await NestFactory.create(SwaggerAppModule);

    const config = new DocumentBuilder()
        .setTitle('Salon Black & White API')
        .setDescription('API documentation for the salon management system')
        .setVersion('1.0')
        .setContact(
            'Salon Black & White',
            'https://github.com/gniewkob/salonbw',
            'contact@example.com',
        )
        .addBearerAuth()
        .build();

    const document = SwaggerModule.createDocument(app, config);
    writeFileSync('openapi.json', JSON.stringify(document, null, 2));

    await app.close();
}

void generateOpenApi();
