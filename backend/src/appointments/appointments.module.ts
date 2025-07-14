import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from './appointment.entity';
import { AppointmentsService } from './appointments.service';
import { ClientAppointmentsController } from './client-appointments.controller';
import { EmployeeAppointmentsController } from './employee-appointments.controller';
import { AdminAppointmentsController } from './admin-appointments.controller';
import { FormulasModule } from '../formulas/formulas.module';
import { CommissionRecord } from '../commissions/commission-record.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Appointment, CommissionRecord]), FormulasModule],
    controllers: [
        ClientAppointmentsController,
        EmployeeAppointmentsController,
        AdminAppointmentsController,
    ],
    providers: [AppointmentsService],
})
export class AppointmentsModule {}
