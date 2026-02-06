import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
    WarehouseOrder,
    WarehouseOrderStatus,
} from './entities/warehouse-order.entity';
import { WarehouseOrderItem } from './entities/warehouse-order-item.entity';
import { Product } from '../products/product.entity';
import {
    CreateWarehouseOrderDto,
    UpdateWarehouseOrderDto,
    ReceiveWarehouseOrderDto,
} from './dto/order.dto';
import { User } from '../users/user.entity';
import { LogAction } from '../logs/log-action.enum';
import { LogService } from '../logs/log.service';

@Injectable()
export class OrdersService {
    constructor(
        @InjectRepository(WarehouseOrder)
        private readonly ordersRepository: Repository<WarehouseOrder>,
        @InjectRepository(WarehouseOrderItem)
        private readonly orderItemsRepository: Repository<WarehouseOrderItem>,
        @InjectRepository(Product)
        private readonly productsRepository: Repository<Product>,
        private readonly dataSource: DataSource,
        private readonly logService: LogService,
    ) {}

    async findAll(): Promise<WarehouseOrder[]> {
        return this.ordersRepository.find({
            relations: ['supplier', 'items', 'items.product', 'createdBy'],
            order: { createdAt: 'DESC' },
        });
    }

    async findOne(id: number): Promise<WarehouseOrder> {
        const order = await this.ordersRepository.findOne({
            where: { id },
            relations: ['supplier', 'items', 'items.product', 'createdBy'],
        });

        if (!order) {
            throw new NotFoundException(`Order ${id} not found`);
        }

        return order;
    }

    async create(
        dto: CreateWarehouseOrderDto,
        actor: User,
    ): Promise<WarehouseOrder> {
        if (!dto.items || dto.items.length === 0) {
            throw new BadRequestException('Order requires at least one item');
        }

        const orderNumber = await this.generateOrderNumber();

        const order = this.ordersRepository.create({
            orderNumber,
            supplierId: dto.supplierId ?? null,
            notes: dto.notes ?? null,
            status: WarehouseOrderStatus.Draft,
            createdById: actor.id ?? null,
        });

        const saved = await this.ordersRepository.save(order);

        const items: WarehouseOrderItem[] = [];
        for (const inputItem of dto.items) {
            let productName = inputItem.productName ?? '';
            if (inputItem.productId) {
                const product = await this.productsRepository.findOne({
                    where: { id: inputItem.productId },
                });
                if (!product) {
                    throw new NotFoundException(
                        `Product ${inputItem.productId} not found`,
                    );
                }
                productName = product.name;
            }

            items.push(
                this.orderItemsRepository.create({
                    orderId: saved.id,
                    productId: inputItem.productId ?? null,
                    productName,
                    quantity: inputItem.quantity,
                    unit: inputItem.unit ?? 'op.',
                    receivedQuantity: 0,
                }),
            );
        }

        await this.orderItemsRepository.save(items);

        try {
            await this.logService.logAction(actor, LogAction.DELIVERY_CREATED, {
                entity: 'warehouse_order',
                orderId: saved.id,
                orderNumber,
            });
        } catch {
            // non-fatal
        }

        return this.findOne(saved.id);
    }

    async update(
        id: number,
        dto: UpdateWarehouseOrderDto,
        actor: User,
    ): Promise<WarehouseOrder> {
        const order = await this.findOne(id);
        if (
            order.status === WarehouseOrderStatus.Received ||
            order.status === WarehouseOrderStatus.Cancelled
        ) {
            throw new BadRequestException('Cannot modify closed order');
        }

        if (dto.supplierId !== undefined) {
            order.supplierId = dto.supplierId;
        }
        if (dto.notes !== undefined) {
            order.notes = dto.notes;
        }

        await this.ordersRepository.save(order);

        if (dto.items) {
            await this.orderItemsRepository.delete({ orderId: id });
            const mapped = dto.items.map((item) =>
                this.orderItemsRepository.create({
                    orderId: id,
                    productId: item.productId ?? null,
                    productName: item.productName ?? '',
                    quantity: item.quantity,
                    unit: item.unit ?? 'op.',
                    receivedQuantity: 0,
                }),
            );
            if (mapped.length > 0) {
                await this.orderItemsRepository.save(mapped);
            }
        }

        try {
            await this.logService.logAction(actor, LogAction.DELIVERY_CREATED, {
                entity: 'warehouse_order',
                orderId: id,
                action: 'update',
            });
        } catch {
            // non-fatal
        }

        return this.findOne(id);
    }

    async send(id: number, actor: User): Promise<WarehouseOrder> {
        const order = await this.findOne(id);
        if (order.status !== WarehouseOrderStatus.Draft) {
            throw new BadRequestException('Only draft orders can be sent');
        }

        order.status = WarehouseOrderStatus.Sent;
        order.sentAt = new Date();
        await this.ordersRepository.save(order);

        try {
            await this.logService.logAction(actor, LogAction.DELIVERY_CREATED, {
                entity: 'warehouse_order',
                orderId: id,
                action: 'send',
            });
        } catch {
            // non-fatal
        }

        return this.findOne(id);
    }

    async cancel(id: number, actor: User): Promise<WarehouseOrder> {
        const order = await this.findOne(id);
        if (order.status === WarehouseOrderStatus.Received) {
            throw new BadRequestException('Cannot cancel received order');
        }

        order.status = WarehouseOrderStatus.Cancelled;
        await this.ordersRepository.save(order);

        try {
            await this.logService.logAction(
                actor,
                LogAction.DELIVERY_CANCELLED,
                {
                    entity: 'warehouse_order',
                    orderId: id,
                },
            );
        } catch {
            // non-fatal
        }

        return this.findOne(id);
    }

    async receive(
        id: number,
        dto: ReceiveWarehouseOrderDto,
        actor: User,
    ): Promise<WarehouseOrder> {
        const order = await this.findOne(id);
        if (
            order.status !== WarehouseOrderStatus.Sent &&
            order.status !== WarehouseOrderStatus.PartiallyReceived
        ) {
            throw new BadRequestException('Only sent orders can be received');
        }

        await this.dataSource.transaction(async (manager) => {
            for (const item of order.items) {
                if (!item.productId) continue;
                const product = await manager.findOne(Product, {
                    where: { id: item.productId },
                });
                if (!product) continue;

                product.stock += item.quantity;
                await manager.save(product);

                item.receivedQuantity = item.quantity;
                await manager.save(item);
            }

            order.status = WarehouseOrderStatus.Received;
            order.receivedAt = new Date();
            if (dto.notes) {
                order.notes = `${order.notes ?? ''}\n${dto.notes}`.trim();
            }
            await manager.save(order);
        });

        try {
            await this.logService.logAction(
                actor,
                LogAction.DELIVERY_RECEIVED,
                {
                    entity: 'warehouse_order',
                    orderId: id,
                },
            );
        } catch {
            // non-fatal
        }

        return this.findOne(id);
    }

    private async generateOrderNumber(): Promise<string> {
        const now = new Date();
        const prefix = `Z${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;

        const last = await this.ordersRepository.findOne({
            where: {},
            order: { id: 'DESC' },
        });

        const nextNum = (last?.id ?? 0) + 1;
        return `${prefix}${String(nextNum).padStart(5, '0')}`;
    }
}
