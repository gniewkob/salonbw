import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from '../appointments/appointment.entity';
import { CalendarController } from './calendar.controller';
import { CalendarService } from './calendar.service';
import { GoogleCalendarAdapter } from './google-calendar.adapter';
import { OutlookCalendarAdapter } from './outlook-calendar.adapter';
import { LogsModule } from '../logs/logs.module';

@Module({
    imports: [TypeOrmModule.forFeature([Appointment]), LogsModule],
    controllers: [CalendarController],
    providers: [CalendarService, GoogleCalendarAdapter, OutlookCalendarAdapter],
})
export class CalendarModule {}
