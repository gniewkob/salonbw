import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Commission } from './commission.entity';
import { CommissionsService } from './commissions.service';
import { CommissionsController } from './commissions.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Commission])],
    providers: [CommissionsService],
    controllers: [CommissionsController],
    exports: [CommissionsService],
})
export class CommissionsModule {}
