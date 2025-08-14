import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesGuard } from '../auth/roles.guard';
import { Service } from './service.entity';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';
import { LogsModule } from '../logs/logs.module';

@Module({
    imports: [TypeOrmModule.forFeature([Service]), LogsModule],
    providers: [ServicesService, RolesGuard],
    controllers: [ServicesController],
})
export class ServicesModule {}
