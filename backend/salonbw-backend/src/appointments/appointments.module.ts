import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from './appointment.entity';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointments.controller';
import { CommissionsModule } from '../commissions/commissions.module';

@Module({
    imports: [TypeOrmModule.forFeature([Appointment]), CommissionsModule],
    providers: [AppointmentsService],
    controllers: [AppointmentsController],
})
export class AppointmentsModule {}
