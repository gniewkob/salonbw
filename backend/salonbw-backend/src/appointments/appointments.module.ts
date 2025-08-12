import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from './appointment.entity';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointments.controller';
import { CommissionsModule } from '../commissions/commissions.module';
import { Service as SalonService } from '../services/service.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Appointment, SalonService]),
        CommissionsModule,
    ],
    providers: [AppointmentsService],
    controllers: [AppointmentsController],
})
export class AppointmentsModule {}
