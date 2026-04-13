import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice } from './invoice.entity';
import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller';
import { JpkService } from './jpk.service';

@Module({
    imports: [TypeOrmModule.forFeature([Invoice])],
    providers: [InvoicesService, JpkService],
    controllers: [InvoicesController],
    exports: [InvoicesService, JpkService],
})
export class InvoicesModule {}
