import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from './appointment.entity';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointments.controller';
import { CommissionsModule } from '../commissions/commissions.module';
import { Service as SalonService } from '../services/service.entity';
import { ServiceVariant } from '../services/entities/service-variant.entity';
import { User } from '../users/user.entity';
import { LogsModule } from '../logs/logs.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ObservabilityModule } from '../observability/observability.module';
import { RetailModule } from '../retail/retail.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Appointment,
            SalonService,
            ServiceVariant,
            User,
        ]),
        CommissionsModule,
        LogsModule,
        NotificationsModule,
        ObservabilityModule,
        forwardRef(() => RetailModule),
    ],
    providers: [AppointmentsService],
    controllers: [AppointmentsController],
    exports: [AppointmentsService],
})
export class AppointmentsModule {}
