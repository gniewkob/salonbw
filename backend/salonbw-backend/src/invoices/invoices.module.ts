import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice } from './invoice.entity';
import { InvoicesService } from './invoices.service';
import { JPKService } from './jpk.service';
import { InvoicesController } from './invoices.controller';
import { Appointment } from '../appointments/appointment.entity';
import { BranchSettings } from '../settings/entities/branch-settings.entity';
import { ObservabilityModule } from '../observability/observability.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Invoice, Appointment, BranchSettings]),
        ObservabilityModule,
    ],
    providers: [InvoicesService, JPKService],
    controllers: [InvoicesController],
    exports: [InvoicesService, JPKService],
})
export class InvoicesModule {}
