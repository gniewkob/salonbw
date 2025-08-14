import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Commission } from './commission.entity';
import { CommissionsService } from './commissions.service';
import { CommissionsController } from './commissions.controller';
import { LogsModule } from '../logs/logs.module';

@Module({
    imports: [TypeOrmModule.forFeature([Commission]), LogsModule],
    providers: [CommissionsService],
    controllers: [CommissionsController],
    exports: [CommissionsService],
})
export class CommissionsModule {}
