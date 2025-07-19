import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice } from './invoice.entity';
import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller';
import { Appointment } from '../appointments/appointment.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Invoice, Appointment])],
    providers: [InvoicesService],
    controllers: [InvoicesController],
    exports: [InvoicesService],
})
export class InvoicesModule {}
