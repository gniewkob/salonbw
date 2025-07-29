import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice } from './invoice.entity';
import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller';
import { Appointment } from '../appointments/appointment.entity';
import { LogsModule } from '../logs/logs.module';

@Module({
    imports: [TypeOrmModule.forFeature([Invoice, Appointment]), LogsModule],
    providers: [InvoicesService],
    controllers: [InvoicesController],
    exports: [InvoicesService],
})
export class InvoicesModule {}
