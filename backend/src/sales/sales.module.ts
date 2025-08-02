import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sale } from './sale.entity';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { Product } from '../catalog/product.entity';
import { CommissionRecord } from '../commissions/commission-record.entity';
import { CommissionsModule } from '../commissions/commissions.module';
import { ProductUsageModule } from '../product-usage/product-usage.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Sale, Product, CommissionRecord]),
        CommissionsModule,
        ProductUsageModule,
    ],
    controllers: [SalesController],
    providers: [SalesService],
    exports: [TypeOrmModule, SalesService],
})
export class SalesModule {}
