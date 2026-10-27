import { Module } from '@nestjs/common';
import { CalendarModule } from '../calendar/calendar.module';
import { User } from '../users/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Timetable } from './entities/timetable.entity';
import { TimetableSlot } from './entities/timetable-slot.entity';
import { TimetableException } from './entities/timetable-exception.entity';
import { TimetableTemplate } from './entities/timetable-template.entity';
import { TimetableTemplateDay } from './entities/timetable-template-day.entity';
import { TimetablesService } from './timetables.service';
import { TimetablesController } from './timetables.controller';
import { TimetableTemplatesService } from './timetable-templates.service';
import { TimetableTemplatesController } from './timetable-templates.controller';
import { LogsModule } from '../logs/logs.module';

@Module({
    imports: [
        CalendarModule,
        TypeOrmModule.forFeature([
            User,
            Timetable,
            TimetableSlot,
            TimetableException,
            TimetableTemplate,
            TimetableTemplateDay,
        ]),
        LogsModule,
    ],
    providers: [TimetablesService, TimetableTemplatesService],
    controllers: [TimetablesController, TimetableTemplatesController],
    exports: [TimetablesService, TimetableTemplatesService],
})
export class TimetablesModule {}
