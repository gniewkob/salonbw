import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Service } from './service.entity';
import { Product } from './product.entity';
import { Category } from './category.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Service, Product, Category])],
    exports: [TypeOrmModule],
})
export class CatalogModule {}
