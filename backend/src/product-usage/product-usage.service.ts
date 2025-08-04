import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { ProductUsage } from './product-usage.entity';
import { Product } from '../catalog/product.entity';
import { LogsService } from '../logs/logs.service';
import { LogAction } from '../logs/action.enum';
import { UsageType } from './usage-type.enum';

@Injectable()
export class ProductUsageService {
    constructor(
        @InjectRepository(ProductUsage)
        private readonly repo: Repository<ProductUsage>,
        @InjectRepository(Product)
        private readonly products: Repository<Product>,
        private readonly logs: LogsService,
    ) {}

    async registerUsage(
        appointmentId: number,
        employeeId: number,
        entries: {
            productId: number;
            quantity: number;
            usageType: UsageType;
        }[],
    ) {
        return this.repo.manager.transaction(async (manager) => {
            const records: ProductUsage[] = [];
            for (const { productId, quantity, usageType } of entries) {
                if (usageType === UsageType.SALE) {
                    throw new BadRequestException(
                        'sale entries must be registered via SalesService',
                    );
                }
                if (quantity <= 0) {
                    throw new BadRequestException('quantity must be > 0');
                }
                // Acquire a pessimistic write lock to avoid concurrent stock modifications
                const product = await manager.findOne(Product, {
                    where: { id: productId },
                    lock: { mode: 'pessimistic_write' },
                });
                if (!product) {
                    throw new NotFoundException(
                        `Product ${productId} not found`,
                    );
                }
                if (product.stock < quantity) {
                    throw new ConflictException('insufficient stock');
                }
                product.stock -= quantity;
                await manager.save(Product, product);
                const usage = manager.create(ProductUsage, {
                    appointment: { id: appointmentId } as any,
                    product: { id: productId } as any,
                    quantity,
                    usageType,
                    usedByEmployee: { id: employeeId } as any,
                });
                records.push(await manager.save(ProductUsage, usage));
                await this.logs.create(
                    LogAction.ProductUsed,
                    JSON.stringify({
                        appointmentId,
                        productId,
                        quantity,
                        usageType,
                        stock: product.stock,
                    }),
                    employeeId,
                );
            }
            return records;
        });
    }

    async createStockCorrection(
        manager: EntityManager,
        productId: number,
        quantity: number,
        stock: number,
        employeeId: number,
    ) {
        const usage = manager.create(ProductUsage, {
            appointment: null,
            product: { id: productId } as any,
            quantity,
            usageType: UsageType.STOCK_CORRECTION,
            usedByEmployee: { id: employeeId } as any,
        });
        await manager.save(ProductUsage, usage);
        await this.logs.create(
            LogAction.ProductUsed,
            JSON.stringify({
                appointmentId: null,
                productId,
                quantity,
                usageType: UsageType.STOCK_CORRECTION,
                stock,
            }),
            employeeId,
        );
        return usage;
    }

    async createSale(
        productId: number,
        quantity: number,
        stock: number,
        employeeId: number,
        appointmentId?: number,
    ) {
        const usage = this.repo.create({
            appointment: appointmentId
                ? ({ id: appointmentId } as any)
                : null,
            product: { id: productId } as any,
            quantity,
            usageType: UsageType.SALE,
            usedByEmployee: { id: employeeId } as any,
        });
        await this.repo.save(usage);
        await this.logs.create(
            LogAction.ProductUsed,
            JSON.stringify({
                appointmentId: appointmentId ?? null,
                productId,
                quantity,
                usageType: UsageType.SALE,
                stock,
            }),
            employeeId,
        );
        return usage;
    }

    findForProduct(productId: number, usageType?: UsageType) {
        const where: any = { product: { id: productId } };
        if (usageType) {
            where.usageType = usageType;
        }
        return this.repo.find({
            where,
            order: { timestamp: 'DESC' },
        });
    }
}
