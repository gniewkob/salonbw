import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { User } from '../users/user.entity';
import { Appointment } from '../appointments/appointment.entity';
import { Review } from '../reviews/review.entity';
import { Notification } from '../notifications/notification.entity';
import { EmployeeCommission } from '../commissions/employee-commission.entity';
import { Product } from '../catalog/product.entity';
import { Log } from '../logs/log.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            User,
            Appointment,
            Review,
            Notification,
            EmployeeCommission,
            Product,
            Log,
        ]),
    ],
    controllers: [DashboardController],
    providers: [DashboardService],
})
export class DashboardModule {}
