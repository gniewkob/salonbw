import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from '../catalog/category.entity';
import { Service } from '../catalog/service.entity';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { LogsModule } from '../logs/logs.module';

@Module({
    imports: [TypeOrmModule.forFeature([Category, Service]), LogsModule],
    controllers: [CategoriesController],
    providers: [CategoriesService],
    exports: [TypeOrmModule],
})
export class CategoriesModule {}
