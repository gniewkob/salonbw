import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from '../appointments/appointment.entity';
import { User } from '../users/user.entity';
import { Service } from '../services/service.entity';
import { ServiceVariant } from '../services/entities/service-variant.entity';
import { ServiceCategory } from '../services/entities/service-category.entity';
import { EmployeeService } from '../services/entities/employee-service.entity';
import { Timetable } from '../timetables/entities/timetable.entity';
import { VersumCompatController } from './versum-compat.controller';
import { VersumCompatService } from './versum-compat.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Appointment,
            User,
            Service,
            ServiceVariant,
            ServiceCategory,
            EmployeeService,
            Timetable,
        ]),
    ],
    controllers: [VersumCompatController],
    providers: [VersumCompatService],
})
export class VersumCompatModule {}
