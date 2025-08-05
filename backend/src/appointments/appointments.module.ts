import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from './appointment.entity';
import { AppointmentsService } from './appointments.service';
import { ClientAppointmentsController } from './client-appointments.controller';
import { EmployeeAppointmentsController } from './employee-appointments.controller';
import { AdminAppointmentsController } from './admin-appointments.controller';
import { MeAppointmentsController } from './me-appointments.controller';
import { AppointmentReviewsController } from './appointment-reviews.controller';
import { FormulasModule } from '../formulas/formulas.module';
import { CommissionsModule } from '../commissions/commissions.module';
import { LogsModule } from '../logs/logs.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ReviewsModule } from '../reviews/reviews.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Appointment]),
        forwardRef(() => FormulasModule),
        CommissionsModule,
        LogsModule,
        NotificationsModule,
        ReviewsModule,
    ],

    controllers: [
        ClientAppointmentsController,
        EmployeeAppointmentsController,
        AdminAppointmentsController,
        MeAppointmentsController,
        AppointmentReviewsController,
    ],
    providers: [AppointmentsService],
    exports: [AppointmentsService],
})
export class AppointmentsModule {}
