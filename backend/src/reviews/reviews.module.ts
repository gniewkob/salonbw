import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Review } from './review.entity';
import { Appointment } from '../appointments/appointment.entity';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Review, Appointment])],
    providers: [ReviewsService],
    controllers: [ReviewsController],
    exports: [TypeOrmModule, ReviewsService],
})
export class ReviewsModule {}
