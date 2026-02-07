import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from '../appointments/appointment.entity';
import { User } from '../users/user.entity';
import { Service } from '../services/service.entity';
import { ServiceVariant } from '../services/entities/service-variant.entity';
import { ServiceCategory } from '../services/entities/service-category.entity';
import { EmployeeService } from '../services/entities/employee-service.entity';
import { Timetable } from '../timetables/entities/timetable.entity';
import { CustomerGroup } from '../customers/entities/customer-group.entity';
import { CustomerNote } from '../customers/entities/customer-note.entity';
import { CustomerTag } from '../customers/entities/customer-tag.entity';
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
            CustomerGroup,
            CustomerNote,
            CustomerTag,
        ]),
    ],
    controllers: [VersumCompatController],
    providers: [VersumCompatService],
})
export class VersumCompatModule {}
