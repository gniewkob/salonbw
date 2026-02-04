import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesGuard } from '../auth/roles.guard';
import { Product } from './product.entity';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { LogsModule } from '../logs/logs.module';
import { ProductCategory } from './entities/product-category.entity';
import { ProductCommissionRule } from './entities/product-commission-rule.entity';
import { ServiceRecipeItem } from '../services/entities/service-recipe-item.entity';
import { User } from '../users/user.entity';
import { ProductCategoriesController } from './product-categories.controller';
import { ProductCategoriesService } from './product-categories.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Product,
            ProductCategory,
            ProductCommissionRule,
            ServiceRecipeItem,
            User,
        ]),
        LogsModule,
    ],
    providers: [ProductsService, ProductCategoriesService, RolesGuard],
    controllers: [ProductsController, ProductCategoriesController],
    exports: [ProductCategoriesService],
})
export class ProductsModule {}
