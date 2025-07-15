import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Service as ServiceEntity } from '../catalog/service.entity';
import { Appointment } from '../appointments/appointment.entity';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';
import { LogsModule } from '../logs/logs.module';

@Module({
    imports: [TypeOrmModule.forFeature([ServiceEntity, Appointment]), LogsModule],
    controllers: [ServicesController],
    providers: [ServicesService],
})
export class ServicesModule {}
