import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommissionRecord } from './commission-record.entity';
import { EmployeeCommission } from './employee-commission.entity';
import { CommissionRule } from './commission-rule.entity';
import { CommissionsService } from './commissions.service';
import { CommissionsController } from './commissions.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([CommissionRecord, EmployeeCommission, CommissionRule]),
    ],
    controllers: [CommissionsController],
    providers: [CommissionsService],
    exports: [TypeOrmModule, CommissionsService],
})
export class CommissionsModule {}
