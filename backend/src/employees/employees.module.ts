import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { EmployeesService } from './employees.service';
import { EmployeesController } from './employees.controller';
import { LogsModule } from '../logs/logs.module';
import { EmployeeReviewsController } from './employee-reviews.controller';
import { ReviewsModule } from '../reviews/reviews.module';

@Module({
    imports: [TypeOrmModule.forFeature([User]), LogsModule, ReviewsModule],
    controllers: [EmployeesController, EmployeeReviewsController],
    providers: [EmployeesService],
    exports: [TypeOrmModule, EmployeesService],
})
export class EmployeesModule {}
