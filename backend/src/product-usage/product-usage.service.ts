import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductUsage } from './product-usage.entity';
import { Product } from '../catalog/product.entity';
import { LogsService } from '../logs/logs.service';
import { LogAction } from '../logs/action.enum';

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
        entries: { productId: number; quantity: number }[],
    ) {
        return this.repo.manager.transaction(async (manager) => {
            const records: ProductUsage[] = [];
            for (const { productId, quantity } of entries) {
                if (quantity <= 0) {
                    throw new BadRequestException('quantity must be > 0');
                }
                const product = await manager.findOne(Product, {
                    where: { id: productId },
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
                    usedByEmployee: { id: employeeId } as any,
                });
                records.push(await manager.save(ProductUsage, usage));
                await this.logs.create(
                    LogAction.ProductUsed,
                    JSON.stringify({
                        appointmentId,
                        productId,
                        quantity,
                        stock: product.stock,
                    }),
                    employeeId,
                );
            }
            return records;
        });
    }

    findForProduct(productId: number) {
        return this.repo.find({
            where: { product: { id: productId } },
            order: { timestamp: 'DESC' },
        });
    }
}
