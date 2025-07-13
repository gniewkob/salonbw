import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommissionRecord } from './commission-record.entity';

@Module({
    imports: [TypeOrmModule.forFeature([CommissionRecord])],
    exports: [TypeOrmModule],
})
export class CommissionsModule {}
