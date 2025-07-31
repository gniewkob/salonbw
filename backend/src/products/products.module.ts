import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin/admin.controller';
import { EmployeeController } from './employee/employee.controller';
import { PublicController } from './public/public.controller';
import { ProductsService } from './products.service';
import { Product } from '../catalog/product.entity';
import { Sale } from '../sales/sale.entity';
import { LogsModule } from '../logs/logs.module';

@Module({
    imports: [TypeOrmModule.forFeature([Product, Sale]), LogsModule],
    controllers: [AdminController, EmployeeController, PublicController],
    providers: [ProductsService],
    exports: [TypeOrmModule, ProductsService],
})
export class ProductsModule {}
