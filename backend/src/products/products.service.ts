import {
    Injectable,
    BadRequestException,
    NotFoundException,
    ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, OptimisticLockVersionMismatchError } from 'typeorm';
import { Product } from '../catalog/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { LogsService } from '../logs/logs.service';
import { LogAction } from '../logs/action.enum';
import { Sale } from '../sales/sale.entity';
import { ProductUsageService } from '../product-usage/product-usage.service';
import { UsageType } from '../product-usage/usage-type.enum';
import { ProductUsage } from '../product-usage/product-usage.entity';

@Injectable()
export class ProductsService {
    private readonly useOptimisticLocking =
        process.env.USE_OPTIMISTIC_LOCKING === 'true';
    constructor(
        @InjectRepository(Product)
        private readonly repo: Repository<Product>,
        @InjectRepository(Sale)
        private readonly sales: Repository<Sale>,
        @InjectRepository(ProductUsage)
        private readonly usageRepo: Repository<ProductUsage>,
        private readonly logs: LogsService,
        private readonly usage: ProductUsageService,
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

    async updateStock(id: number, amount: number, userId: number) {
        // userId identifies who performed the stock adjustment
        let product: Product | null;
        try {
            product = await this.repo.findOne({
                where: { id },
                lock: this.useOptimisticLocking
                    ? undefined
                    : { mode: 'pessimistic_write' },
            });
        } catch (e) {
            if (e instanceof OptimisticLockVersionMismatchError) {
                throw new ConflictException('Optimistic lock error');
            }
            throw e;
        }
        if (!product) return undefined;
        if (product.stock + amount < 0) {
            throw new BadRequestException('stock must be >= 0');
        }
        product.stock += amount;
        let saved: Product;
        try {
            saved = await this.repo.save(product);
        } catch (e) {
            if (e instanceof OptimisticLockVersionMismatchError) {
                throw new ConflictException('Optimistic lock error');
            }
            throw e;
        }
        if (amount < 0) {
            await this.usage.createStockCorrection(
                this.repo.manager,
                id,
                -amount,
                saved.stock,
                userId,
            );
        }
        const logPayload: any = {
            id,
            amount,
            stock: saved.stock,
        };
        if (amount < 0) {
            logPayload.usageType = UsageType.STOCK_CORRECTION;
        }
        await this.logs.create(
            LogAction.UpdateProductStock,
            JSON.stringify(logPayload),
        );
        return saved;
    }

    async bulkUpdateStock(
        entries: { id: number; stock: number }[],
        userId: number,
    ) {
        return this.repo.manager.transaction(async (manager) => {
            const updated: { prod: Product; diff: number }[] = [];
            for (const { id, stock } of entries) {
                if (stock < 0) {
                    throw new BadRequestException('stock must be >= 0');
                }
                let product: Product | null;
                try {
                    product = await manager.findOne(Product, {
                        where: { id },
                        lock: this.useOptimisticLocking
                            ? undefined
                            : { mode: 'pessimistic_write' },
                    });
                } catch (e) {
                    if (e instanceof OptimisticLockVersionMismatchError) {
                        throw new ConflictException('Optimistic lock error');
                    }
                    throw e;
                }
                if (!product) {
                    throw new NotFoundException(`Product ${id} not found`);
                }
                const diff = product.stock - stock;
                product.stock = stock;
                let saved: Product;
                try {
                    saved = await manager.save(Product, product);
                } catch (e) {
                    if (e instanceof OptimisticLockVersionMismatchError) {
                        throw new ConflictException('Optimistic lock error');
                    }
                    throw e;
                }
                updated.push({ prod: saved, diff });
                if (diff > 0) {
                    await this.usage.createStockCorrection(
                        manager,
                        id,
                        diff,
                        stock,
                        userId,
                    );
                }
            }

            for (const { prod, diff } of updated) {
                const payload: any = { id: prod.id, stock: prod.stock };
                if (diff > 0) {
                    payload.usageType = UsageType.STOCK_CORRECTION;
                }
                await this.logs.create(
                    LogAction.BulkUpdateProductStock,
                    JSON.stringify(payload),
                );
            }
            return updated.map((u) => u.prod);
        });
    }

    async remove(id: number) {
        const entity = await this.repo.findOne({ where: { id } });
        if (!entity) throw new NotFoundException();
        const usageCount = await this.usageRepo.count({ where: { product: { id } } });
        // Prevent deletion when usage records exist
        if (usageCount > 0) {
            throw new ConflictException('Product has usage records');
        }
        const salesCount = await this.sales.count({ where: { product: { id } } });
        if (salesCount > 0) {
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
