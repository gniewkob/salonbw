import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from '../appointments/appointment.entity';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { LogsModule } from '../logs/logs.module';

@Module({
    imports: [TypeOrmModule.forFeature([Appointment]), LogsModule],
    providers: [PaymentsService],
    controllers: [PaymentsController],
})
export class PaymentsModule {}
