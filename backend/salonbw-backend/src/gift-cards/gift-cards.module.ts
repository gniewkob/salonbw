import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GiftCard, GiftCardTransaction } from './entities/gift-card.entity';
import { GiftCardsService } from './gift-cards.service';
import { GiftCardsController } from './gift-cards.controller';
import { LogsModule } from '../logs/logs.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([GiftCard, GiftCardTransaction]),
        LogsModule,
    ],
    providers: [GiftCardsService],
    controllers: [GiftCardsController],
    exports: [GiftCardsService],
})
export class GiftCardsModule {}
