import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesController } from './sales.controller';
import { InventoryController } from './inventory.controller';
import { RetailService } from './retail.service';
import { Product } from '../products/product.entity';
import { Appointment } from '../appointments/appointment.entity';
import { User } from '../users/user.entity';
import { CommissionsModule } from '../commissions/commissions.module';
import { LogsModule } from '../logs/logs.module';
import { UsageController } from './usage.controller';
import { WarehouseSale } from '../warehouse/entities/warehouse-sale.entity';
import { WarehouseSaleItem } from '../warehouse/entities/warehouse-sale-item.entity';
import { WarehouseUsage } from '../warehouse/entities/warehouse-usage.entity';
import { WarehouseUsageItem } from '../warehouse/entities/warehouse-usage-item.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Product,
            Appointment,
            User,
            WarehouseSale,
            WarehouseSaleItem,
            WarehouseUsage,
            WarehouseUsageItem,
        ]),
        CommissionsModule,
        LogsModule,
    ],
    controllers: [SalesController, InventoryController, UsageController],
    providers: [RetailService],
    exports: [RetailService],
})
export class RetailModule {}
