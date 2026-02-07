import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatisticsService } from './statistics.service';
import { StatisticsController } from './statistics.controller';
import { Appointment } from '../appointments/appointment.entity';
import { User } from '../users/user.entity';
import { Review } from '../reviews/review.entity';
import { Timetable } from '../timetables/entities/timetable.entity';
import { TimetableException } from '../timetables/entities/timetable-exception.entity';
import { Commission } from '../commissions/commission.entity';
import { ProductMovement } from '../warehouse/entities/product-movement.entity';
import { Product } from '../products/product.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Appointment,
            User,
            Review,
            Timetable,
            TimetableException,
            Commission,
            ProductMovement,
            Product,
        ]),
    ],
    controllers: [StatisticsController],
    providers: [StatisticsService],
    exports: [StatisticsService],
})
export class StatisticsModule {}
