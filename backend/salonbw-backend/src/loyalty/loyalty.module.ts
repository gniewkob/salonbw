import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
    LoyaltyProgram,
    LoyaltyBalance,
    LoyaltyTransaction,
    LoyaltyReward,
    LoyaltyRewardRedemption,
} from './entities/loyalty.entity';
import { LoyaltyService } from './loyalty.service';
import { LoyaltyController } from './loyalty.controller';
import { LogsModule } from '../logs/logs.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            LoyaltyProgram,
            LoyaltyBalance,
            LoyaltyTransaction,
            LoyaltyReward,
            LoyaltyRewardRedemption,
        ]),
        LogsModule,
    ],
    providers: [LoyaltyService],
    controllers: [LoyaltyController],
    exports: [LoyaltyService],
})
export class LoyaltyModule {}
