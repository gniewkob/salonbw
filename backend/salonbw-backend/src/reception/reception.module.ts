import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from '../appointments/appointment.entity';
import { CrmController } from './crm.controller';
import { ReceptionController } from './reception.controller';
import { ReceptionOperationalEvent } from './entities/reception-operational-event.entity';
import { ReceptionService } from './reception.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([ReceptionOperationalEvent, Appointment]),
    ],
    controllers: [ReceptionController, CrmController],
    providers: [ReceptionService],
    exports: [ReceptionService],
})
export class ReceptionModule {}
