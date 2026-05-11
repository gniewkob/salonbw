import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReceptionController } from './reception.controller';
import { ReceptionOperationalEvent } from './entities/reception-operational-event.entity';
import { ReceptionService } from './reception.service';

@Module({
    imports: [TypeOrmModule.forFeature([ReceptionOperationalEvent])],
    controllers: [ReceptionController],
    providers: [ReceptionService],
    exports: [ReceptionService],
})
export class ReceptionModule {}
