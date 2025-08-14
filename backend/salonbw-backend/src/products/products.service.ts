import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { LogService } from '../logs/log.service';
import { LogAction } from '../logs/log.entity';

@Injectable()
export class ProductsService {
    constructor(
        @InjectRepository(Product)
        private readonly productsRepository: Repository<Product>,
        private readonly logService: LogService,
    ) {}

    async create(dto: CreateProductDto): Promise<Product> {
        const product = this.productsRepository.create(dto);
        const saved = await this.productsRepository.save(product);
        await this.logService.logAction(null, LogAction.Create, {
            productId: saved.id,
            name: saved.name,
        });
        return saved;
    }

    findAll(): Promise<Product[]> {
        return this.productsRepository.find();
    }

    async findOne(id: number): Promise<Product> {
        const product = await this.productsRepository.findOne({
            where: { id },
        });
        if (!product) {
            throw new NotFoundException('Product not found');
        }
        return product;
    }

    async update(id: number, dto: UpdateProductDto): Promise<Product> {
        await this.productsRepository.update(id, dto);
        const updated = await this.findOne(id);
        await this.logService.logAction(null, LogAction.Update, {
            productId: updated.id,
            name: updated.name,
        });
        return updated;
    }

    async remove(id: number): Promise<void> {
        const product = await this.findOne(id);
        await this.productsRepository.delete(id);
        await this.logService.logAction(null, LogAction.Delete, {
            productId: product.id,
            name: product.name,
        });
    }
}
