import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BranchSettings } from './entities/branch-settings.entity';
import { CalendarSettings } from './entities/calendar-settings.entity';
import { OnlineBookingSettings } from './entities/online-booking-settings.entity';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { LogsModule } from '../logs/logs.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            BranchSettings,
            CalendarSettings,
            OnlineBookingSettings,
        ]),
        LogsModule,
    ],
    providers: [SettingsService],
    controllers: [SettingsController],
    exports: [SettingsService],
})
export class SettingsModule {}
