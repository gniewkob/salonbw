import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesGuard } from '../auth/roles.guard';
import { Product } from './product.entity';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Product])],
    providers: [ProductsService, RolesGuard],
    controllers: [ProductsController],
})
export class ProductsModule {}
