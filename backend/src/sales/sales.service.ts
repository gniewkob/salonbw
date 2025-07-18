import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sale } from './sale.entity';
import { Product } from '../catalog/product.entity';
import { CommissionRecord } from '../commissions/commission-record.entity';
import { CommissionsService } from '../commissions/commissions.service';

@Injectable()
export class SalesService {
    constructor(
        @InjectRepository(Sale)
        private readonly repo: Repository<Sale>,
        @InjectRepository(Product)
        private readonly products: Repository<Product>,
        @InjectRepository(CommissionRecord)
        private readonly commissions: Repository<CommissionRecord>,
        private readonly commissionService: CommissionsService,
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
        const product = await this.products.findOne({
            where: { id: productId },
        });
        if (!product) {
            throw new BadRequestException('invalid product');
        }
        if (product.stock < quantity) {
            throw new BadRequestException('insufficient stock');
        }
        product.stock -= quantity;
        await this.products.save(product);

        const sale = this.repo.create({
            client: { id: clientId } as any,
            employee: { id: employeeId } as any,
            product: { id: productId } as any,
            quantity,
        });
        const saved = await this.repo.save(sale);

        const percent =
            (await this.commissionService.getPercentForProduct(
                employeeId,
                product,
                null,
            )) / 100;
        if (percent > 0) {
            const record = this.commissions.create({
                employee: { id: employeeId } as any,
                appointment: null,
                product: { id: productId } as any,
                amount: Number(product.unitPrice) * quantity * percent,
                percent: percent * 100,
            });
            await this.commissions.save(record);
        }

        return saved;
    }
}
