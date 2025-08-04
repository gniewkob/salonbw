import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductUsage } from './product-usage.entity';
import { Product } from '../catalog/product.entity';
import { LogsModule } from '../logs/logs.module';
import { ProductUsageService } from './product-usage.service';
import { AppointmentProductUsageController } from './appointment-product-usage.controller';
import { ProductUsageController } from './product-usage.controller';
import { AppointmentsModule } from '../appointments/appointments.module';
import { SalesModule } from '../sales/sales.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([ProductUsage, Product]),
        LogsModule,
        AppointmentsModule,
        forwardRef(() => SalesModule),
    ],
    controllers: [AppointmentProductUsageController, ProductUsageController],
    providers: [ProductUsageService],
    exports: [TypeOrmModule, ProductUsageService],
})
export class ProductUsageModule {}

export { UsageType } from './usage-type.enum';
