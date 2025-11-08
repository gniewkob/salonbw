import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { LogService } from '../logs/log.service';
import { LogAction } from '../logs/log-action.enum';
import { User } from '../users/user.entity';
import { AppCacheService } from '../cache/cache.service';

const ALL_PRODUCTS_CACHE_KEY = 'products:all';
const productCacheKey = (id: number) => `products:${id}`;

@Injectable()
export class ProductsService {
    constructor(
        @InjectRepository(Product)
        private readonly productsRepository: Repository<Product>,
        private readonly logService: LogService,
        private readonly cache: AppCacheService,
    ) {}

    async create(dto: CreateProductDto, user: User): Promise<Product> {
        const product = this.productsRepository.create(dto);
        const saved = await this.productsRepository.save(product);
        try {
            await this.logService.logAction(user, LogAction.PRODUCT_CREATED, {
                productId: saved.id,
                name: saved.name,
            });
        } catch (error) {
            console.error('Failed to log product creation action', error);
        }
        await this.invalidateCache(saved.id);
        return saved;
    }

    async findAll(): Promise<Product[]> {
        return this.cache.wrap<Product[]>(ALL_PRODUCTS_CACHE_KEY, () =>
            this.productsRepository.find(),
        );
    }

    async findOne(id: number): Promise<Product> {
        const cached = await this.cache.get<Product>(productCacheKey(id));
        if (cached) {
            return cached;
        }
        const product = await this.productsRepository.findOne({
            where: { id },
        });
        if (!product) {
            throw new NotFoundException('Product not found');
        }
        await this.cache.set(productCacheKey(id), product);
        return product;
    }

    async update(
        id: number,
        dto: UpdateProductDto,
        user: User,
    ): Promise<Product> {
        await this.productsRepository.update(id, dto);
        const updated = await this.findOne(id);
        try {
            await this.logService.logAction(user, LogAction.PRODUCT_UPDATED, {
                productId: updated.id,
                name: updated.name,
            });
        } catch (error) {
            console.error('Failed to log product update action', error);
        }
        await this.invalidateCache(id);
        return updated;
    }

    async remove(id: number, user: User): Promise<void> {
        const product = await this.findOne(id);
        await this.productsRepository.delete(id);
        try {
            await this.logService.logAction(user, LogAction.PRODUCT_DELETED, {
                productId: product.id,
                name: product.name,
            });
        } catch (error) {
            console.error('Failed to log product deletion action', error);
        }
        await this.invalidateCache(id);
    }

    private async invalidateCache(id: number): Promise<void> {
        await Promise.all([
            this.cache.del(ALL_PRODUCTS_CACHE_KEY),
            this.cache.del(productCacheKey(id)),
        ]);
    }
}
