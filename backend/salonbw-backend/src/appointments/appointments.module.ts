import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from './appointment.entity';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointments.controller';
import { CommissionsModule } from '../commissions/commissions.module';
import { Service as SalonService } from '../services/service.entity';
import { User } from '../users/user.entity';
import { LogsModule } from '../logs/logs.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ObservabilityModule } from '../observability/observability.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Appointment, SalonService, User]),
        CommissionsModule,
        LogsModule,
        NotificationsModule,
        ObservabilityModule,
    ],
    providers: [AppointmentsService],
    controllers: [AppointmentsController],
    exports: [AppointmentsService],
})
export class AppointmentsModule {}
