import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../catalog/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
    constructor(
        @InjectRepository(Product)
        private readonly repo: Repository<Product>,
    ) {}

    create(dto: CreateProductDto) {
        const prod = this.repo.create(dto);
        return this.repo.save(prod);
    }

    findAll() {
        return this.repo.find();
    }

    async update(id: number, dto: UpdateProductDto) {
        await this.repo.update(id, dto);
        return this.repo.findOne({ where: { id } });
    }
}
