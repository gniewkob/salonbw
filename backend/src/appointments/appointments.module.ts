import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from './appointment.entity';
import { AppointmentsService } from './appointments.service';
import { ClientAppointmentsController } from './client-appointments.controller';
import { EmployeeAppointmentsController } from './employee-appointments.controller';
import { AdminAppointmentsController } from './admin-appointments.controller';
import { FormulasModule } from '../formulas/formulas.module';
import { CommissionsModule } from '../commissions/commissions.module';
import { CommissionRecord } from '../commissions/commission-record.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Appointment, CommissionRecord]),
        forwardRef(() => FormulasModule),
    ],

    controllers: [
        ClientAppointmentsController,
        EmployeeAppointmentsController,
        AdminAppointmentsController,
    ],
    providers: [AppointmentsService],
    exports: [AppointmentsService],
})
export class AppointmentsModule {}
