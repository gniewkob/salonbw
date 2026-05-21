import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TimeBlock } from './entities/time-block.entity';
import { Appointment } from '../appointments/appointment.entity';
import { User } from '../users/user.entity';
import { Service } from '../services/service.entity';
import { EmployeeService } from '../services/entities/employee-service.entity';
import { CalendarService } from './calendar.service';
import { CalendarController } from './calendar.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            TimeBlock,
            Appointment,
            User,
            Service,
            EmployeeService,
        ]),
    ],
    providers: [CalendarService],
    controllers: [CalendarController],
    exports: [CalendarService],
})
export class CalendarModule {}
