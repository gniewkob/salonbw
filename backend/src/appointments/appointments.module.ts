import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from './appointment.entity';
import { AppointmentsService } from './appointments.service';
import { ClientAppointmentsController } from './client-appointments.controller';
import { EmployeeAppointmentsController } from './employee-appointments.controller';
import { AdminAppointmentsController } from './admin-appointments.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Appointment])],
    controllers: [
        ClientAppointmentsController,
        EmployeeAppointmentsController,
        AdminAppointmentsController,
    ],
    providers: [AppointmentsService],
})
export class AppointmentsModule {}
