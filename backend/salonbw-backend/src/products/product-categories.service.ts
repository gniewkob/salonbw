import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductCategory } from './entities/product-category.entity';
import {
    CreateProductCategoryDto,
    UpdateProductCategoryDto,
} from './dto/product-category.dto';

@Injectable()
export class ProductCategoriesService {
    constructor(
        @InjectRepository(ProductCategory)
        private readonly categoriesRepository: Repository<ProductCategory>,
    ) {}

    async findAll(): Promise<ProductCategory[]> {
        return this.categoriesRepository.find({
            relations: ['parent'],
            order: { sortOrder: 'ASC', name: 'ASC' },
        });
    }

    async findTree(): Promise<ProductCategory[]> {
        const categories = await this.categoriesRepository.find({
            relations: ['parent'],
            order: { sortOrder: 'ASC', name: 'ASC' },
        });

        const map = new Map<number, ProductCategory>();
        for (const category of categories) {
            category.children = [];
            map.set(category.id, category);
        }

        const roots: ProductCategory[] = [];
        for (const category of categories) {
            if (category.parentId && map.has(category.parentId)) {
                map.get(category.parentId)?.children.push(category);
            } else {
                roots.push(category);
            }
        }

        return roots;
    }

    async findOne(id: number): Promise<ProductCategory> {
        const category = await this.categoriesRepository.findOne({
            where: { id },
            relations: ['parent'],
        });
        if (!category) {
            throw new NotFoundException('Product category not found');
        }

        return category;
    }

    async create(dto: CreateProductCategoryDto): Promise<ProductCategory> {
        const category = this.categoriesRepository.create({
            ...dto,
            sortOrder: dto.sortOrder ?? 0,
            isActive: dto.isActive ?? true,
        });

        return this.categoriesRepository.save(category);
    }

    async update(
        id: number,
        dto: UpdateProductCategoryDto,
    ): Promise<ProductCategory> {
        const category = await this.findOne(id);

        Object.assign(category, dto);

        await this.categoriesRepository.save(category);

        return this.findOne(id);
    }

    async remove(id: number): Promise<void> {
        const category = await this.findOne(id);
        await this.categoriesRepository.remove(category);
    }
}
