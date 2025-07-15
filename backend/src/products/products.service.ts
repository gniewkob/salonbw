import { Injectable, BadRequestException } from '@nestjs/common';
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
        if (dto.unitPrice < 0 || dto.stock < 0) {
            throw new BadRequestException('unitPrice and stock must be >= 0');
        }
        const prod = this.repo.create(dto);
        return this.repo.save(prod);
    }

    findAll() {
        return this.repo.find();
    }

    async update(id: number, dto: UpdateProductDto) {
        if (dto.unitPrice !== undefined && dto.unitPrice < 0) {
            throw new BadRequestException('unitPrice must be >= 0');
        }
        if (dto.stock !== undefined && dto.stock < 0) {
            throw new BadRequestException('stock must be >= 0');
        }
        await this.repo.update(id, dto);
        return this.repo.findOne({ where: { id } });
    }
}
