import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';

@Injectable()
export class ProductsService {
    constructor(
        @InjectRepository(Product)
        private readonly productsRepository: Repository<Product>,
    ) {}

    async create(data: Product): Promise<Product> {
        const product = this.productsRepository.create(data);
        return this.productsRepository.save(product);
    }

    findAll(): Promise<Product[]> {
        return this.productsRepository.find();
    }

    async findOne(id: number): Promise<Product | null> {
        const product = await this.productsRepository.findOne({ where: { id } });
        return product ?? null;
    }

    async update(id: number, data: Partial<Product>): Promise<Product | null> {
        await this.productsRepository.update(id, data);
        return this.findOne(id);
    }

    async remove(id: number): Promise<void> {
        await this.productsRepository.delete(id);
    }
}
