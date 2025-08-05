import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { Appointment } from '../appointments/appointment.entity';
import { Sale } from '../sales/sale.entity';
import { CommissionRecord } from '../commissions/commission-record.entity';
import { User } from '../users/user.entity';
import { Log } from '../logs/log.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Appointment,
            Sale,
            CommissionRecord,
            User,
            Log,
        ]),
    ],
    controllers: [ReportsController],
    providers: [ReportsService],
})
export class ReportsModule {}
