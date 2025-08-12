import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from './appointment.entity';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointments.controller';
import { CommissionsModule } from '../commissions/commissions.module';
import { Service as SalonService } from '../services/service.entity';
import { User } from '../users/user.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Appointment, SalonService, User]),
        CommissionsModule,
    ],
    providers: [AppointmentsService],
    controllers: [AppointmentsController],
})
export class AppointmentsModule {}
