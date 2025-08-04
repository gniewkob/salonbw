import {
    Injectable,
    BadRequestException,
    ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sale } from './sale.entity';
import { Product } from '../catalog/product.entity';
import { CommissionRecord } from '../commissions/commission-record.entity';
import { CommissionsService } from '../commissions/commissions.service';
import { ProductUsageService } from '../product-usage/product-usage.service';

@Injectable()
export class SalesService {
    constructor(
        @InjectRepository(Sale)
        private readonly repo: Repository<Sale>,
        private readonly commissionService: CommissionsService,
        private readonly usage: ProductUsageService,
    ) {}

    async create(
        clientId: number,
        employeeId: number,
        productId: number,
        quantity: number,
    ) {
        if (quantity <= 0) {
            throw new BadRequestException('quantity must be > 0');
        }
        let updatedStock = 0;
        const saved = await this.repo.manager.transaction(async (manager) => {
            const product = await manager.findOne(Product, {
                where: { id: productId },
                lock: { mode: 'pessimistic_write' },
            });
            if (!product) {
                throw new BadRequestException('invalid product');
            }
            if (product.stock < quantity) {
                throw new ConflictException('insufficient stock');
            }
            product.stock -= quantity;
            updatedStock = product.stock;
            await manager.save(Product, product);

            const sale = manager.create(Sale, {
                client: { id: clientId } as any,
                employee: { id: employeeId } as any,
                product: { id: productId } as any,
                quantity,
            });
            const persisted = await manager.save(Sale, sale);

            const percent =
                (await this.commissionService.getPercentForProduct(
                    employeeId,
                    product,
                    null,
                )) / 100;
            if (percent > 0) {
                const record = manager.create(CommissionRecord, {
                    employee: { id: employeeId } as any,
                    appointment: null,
                    product: { id: productId } as any,
                    amount: Number(product.unitPrice) * quantity * percent,
                    percent: percent * 100,
                });
                await manager.save(CommissionRecord, record);
            }

            return persisted;
        });

        await this.usage.createSale(
            productId,
            quantity,
            updatedStock,
            employeeId,
        );

        return saved;
    }
}
