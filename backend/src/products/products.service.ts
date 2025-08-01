import {
    Injectable,
    BadRequestException,
    NotFoundException,
    ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../catalog/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { LogsService } from '../logs/logs.service';
import { LogAction } from '../logs/action.enum';
import { Sale } from '../sales/sale.entity';

@Injectable()
export class ProductsService {
    constructor(
        @InjectRepository(Product)
        private readonly repo: Repository<Product>,
        @InjectRepository(Sale)
        private readonly sales: Repository<Sale>,
        private readonly logs: LogsService,
    ) {}

    async create(dto: CreateProductDto) {
        if (dto.unitPrice < 0 || dto.stock < 0) {
            throw new BadRequestException('unitPrice and stock must be >= 0');
        }
        const prod = this.repo.create(dto);
        const saved = await this.repo.save(prod);
        await this.logs.create(
            LogAction.CreateProduct,
            JSON.stringify({ id: saved.id, ...dto }),
        );
        return saved;
    }

    findAll() {
        return this.repo.find();
    }

    findOne(id: number) {
        return this.repo.findOne({ where: { id } });
    }

    async update(id: number, dto: UpdateProductDto) {
        if (dto.unitPrice !== undefined && dto.unitPrice < 0) {
            throw new BadRequestException('unitPrice must be >= 0');
        }
        if (dto.stock !== undefined && dto.stock < 0) {
            throw new BadRequestException('stock must be >= 0');
        }
        const entity = await this.repo.findOne({ where: { id } });
        if (!entity) return undefined;
        Object.assign(entity, dto);
        const saved = await this.repo.save(entity);
        await this.logs.create(
            LogAction.UpdateProduct,
            JSON.stringify({ id, ...dto }),
        );
        return saved;
    }

    async updateStock(id: number, amount: number) {
        const product = await this.repo.findOne({ where: { id } });
        if (!product) return undefined;
        if (product.stock + amount < 0) {
            throw new BadRequestException('stock must be >= 0');
        }
        product.stock += amount;
        const saved = await this.repo.save(product);
        await this.logs.create(
            LogAction.UpdateProductStock,
            JSON.stringify({ id, amount, stock: saved.stock }),
        );
        return saved;
    }

    async bulkUpdateStock(entries: { id: number; stock: number }[]) {
        return this.repo.manager.transaction(async (manager) => {
            const updated: Product[] = [];
            for (const { id, stock } of entries) {
                if (stock < 0) {
                    throw new BadRequestException('stock must be >= 0');
                }
                const product = await manager.findOne(Product, {
                    where: { id },
                });
                if (!product) {
                    throw new NotFoundException(`Product ${id} not found`);
                }
                product.stock = stock;
                updated.push(await manager.save(Product, product));
            }

            for (const prod of updated) {
                await this.logs.create(
                    LogAction.BulkUpdateProductStock,
                    JSON.stringify({ id: prod.id, stock: prod.stock }),
                );
            }
            return updated;
        });
    }

    async remove(id: number) {
        const entity = await this.repo.findOne({ where: { id } });
        if (!entity) throw new NotFoundException();
        const count = await this.sales.count({ where: { product: { id } } });
        if (count > 0) {
            throw new ConflictException('Product has sales');
        }
        const result = await this.repo.delete(id);
        await this.logs.create(LogAction.DeleteProduct, JSON.stringify({ id }));
        return result;
    }

    findLowStock() {
        return this.repo
            .createQueryBuilder('p')
            .where('p.stock < p.lowStockThreshold')
            .getMany();
    }
}
