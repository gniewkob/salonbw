import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';
import { HealthController } from './health.controller';

@Module({
    imports: [ConfigModule.forRoot({ isGlobal: true })],
    controllers: [AppController, HealthController],
    providers: [AppService, PrismaService],
    exports: [PrismaService],
})
export class AppModule {}
