import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { Supplier } from './entities/supplier.entity';
import { Delivery } from './entities/delivery.entity';
import { DeliveryItem } from './entities/delivery-item.entity';
import { Stocktaking } from './entities/stocktaking.entity';
import { StocktakingItem } from './entities/stocktaking-item.entity';
import { ProductMovement } from './entities/product-movement.entity';
import { WarehouseOrder } from './entities/warehouse-order.entity';
import { WarehouseOrderItem } from './entities/warehouse-order-item.entity';
import { WarehouseSale } from './entities/warehouse-sale.entity';
import { WarehouseSaleItem } from './entities/warehouse-sale-item.entity';
import { WarehouseUsage } from './entities/warehouse-usage.entity';
import { WarehouseUsageItem } from './entities/warehouse-usage-item.entity';
import { Product } from '../products/product.entity';

// Services
import { SuppliersService } from './suppliers.service';
import { DeliveriesService } from './deliveries.service';
import { StocktakingService } from './stocktaking.service';
import { StockAlertsService } from './stock-alerts.service';

// Controllers
import { SuppliersController } from './suppliers.controller';
import { DeliveriesController } from './deliveries.controller';
import { StocktakingController } from './stocktaking.controller';
import { StockAlertsController } from './stock-alerts.controller';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

// External modules
import { LogsModule } from '../logs/logs.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Supplier,
            Delivery,
            DeliveryItem,
            Stocktaking,
            StocktakingItem,
            ProductMovement,
            WarehouseOrder,
            WarehouseOrderItem,
            WarehouseSale,
            WarehouseSaleItem,
            WarehouseUsage,
            WarehouseUsageItem,
            Product,
        ]),
        LogsModule,
    ],
    controllers: [
        SuppliersController,
        DeliveriesController,
        StocktakingController,
        StockAlertsController,
        OrdersController,
    ],
    providers: [
        SuppliersService,
        DeliveriesService,
        StocktakingService,
        StockAlertsService,
        OrdersService,
    ],
    exports: [
        SuppliersService,
        DeliveriesService,
        StocktakingService,
        StockAlertsService,
        OrdersService,
    ],
})
export class WarehouseModule {}
