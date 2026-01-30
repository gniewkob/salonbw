import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { Appointment } from '../appointments/appointment.entity';
import { CustomerGroup } from './entities/customer-group.entity';
import { CustomerNote } from './entities/customer-note.entity';
import { CustomerTag } from './entities/customer-tag.entity';
import { CustomersService } from './customers.service';
import { CustomerStatisticsService } from './customer-statistics.service';
import {
    CustomersController,
    CustomerGroupsController,
    CustomerTagsController,
} from './customers.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            User,
            Appointment,
            CustomerGroup,
            CustomerNote,
            CustomerTag,
        ]),
    ],
    controllers: [
        CustomersController,
        CustomerGroupsController,
        CustomerTagsController,
    ],
    providers: [CustomersService, CustomerStatisticsService],
    exports: [CustomersService, CustomerStatisticsService],
})
export class CustomersModule {}
