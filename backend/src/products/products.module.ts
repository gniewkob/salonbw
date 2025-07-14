import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin/admin.controller';
import { EmployeeController } from './employee/employee.controller';
import { ProductsService } from './products.service';
import { Product } from '../catalog/product.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Product])],
    controllers: [AdminController, EmployeeController],
    providers: [ProductsService],
    exports: [TypeOrmModule, ProductsService],
})
export class ProductsModule {}
