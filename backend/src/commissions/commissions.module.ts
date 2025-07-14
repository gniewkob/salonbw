import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommissionRecord } from './commission-record.entity';
import { CommissionsService } from './commissions.service';
import { CommissionsController } from './commissions.controller';

@Module({
    imports: [TypeOrmModule.forFeature([CommissionRecord])],
    controllers: [CommissionsController],
    providers: [CommissionsService],
    exports: [TypeOrmModule],
})
export class CommissionsModule {}
