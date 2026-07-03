import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { Appointment } from '../appointments/appointment.entity';
import { Review } from '../reviews/review.entity';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';

@Module({
    imports: [TypeOrmModule.forFeature([User, Appointment, Review])],
    providers: [DashboardService],
    controllers: [DashboardController],
})
export class DashboardModule {}
