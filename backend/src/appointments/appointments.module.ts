import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from './appointment.entity';
import { AppointmentsService } from './appointments.service';
import { ClientAppointmentsController } from './client-appointments.controller';
import { EmployeeAppointmentsController } from './employee-appointments.controller';
import { AdminAppointmentsController } from './admin-appointments.controller';
import { FormulasModule } from '../formulas/formulas.module';
import { CommissionsModule } from '../commissions/commissions.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Appointment]),
        FormulasModule,
        CommissionsModule,
    ],
    controllers: [
        ClientAppointmentsController,
        EmployeeAppointmentsController,
        AdminAppointmentsController,
    ],
    providers: [AppointmentsService],
})
export class AppointmentsModule {}
