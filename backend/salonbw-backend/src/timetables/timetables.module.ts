import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Timetable } from './entities/timetable.entity';
import { TimetableSlot } from './entities/timetable-slot.entity';
import { TimetableException } from './entities/timetable-exception.entity';
import { TimetablesService } from './timetables.service';
import { TimetablesController } from './timetables.controller';
import { LogsModule } from '../logs/logs.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Timetable,
            TimetableSlot,
            TimetableException,
        ]),
        LogsModule,
    ],
    providers: [TimetablesService],
    controllers: [TimetablesController],
    exports: [TimetablesService],
})
export class TimetablesModule {}
