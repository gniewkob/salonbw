import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Delivery, DeliveryStatus } from './entities/delivery.entity';
import { DeliveryItem } from './entities/delivery-item.entity';
import {
    ProductMovement,
    MovementType,
} from './entities/product-movement.entity';
import { Product } from '../products/product.entity';
import {
    CreateDeliveryDto,
    UpdateDeliveryDto,
    AddDeliveryItemDto,
    UpdateDeliveryItemDto,
    ReceiveDeliveryDto,
} from './dto/delivery.dto';
import { LogService } from '../logs/log.service';
import { LogAction } from '../logs/log-action.enum';
import { User } from '../users/user.entity';

@Injectable()
export class DeliveriesService {
    constructor(
        @InjectRepository(Delivery)
        private readonly deliveryRepository: Repository<Delivery>,
        @InjectRepository(DeliveryItem)
        private readonly deliveryItemRepository: Repository<DeliveryItem>,
        @InjectRepository(Product)
        private readonly productRepository: Repository<Product>,
        @InjectRepository(ProductMovement)
        private readonly movementRepository: Repository<ProductMovement>,
        private readonly dataSource: DataSource,
        private readonly logService: LogService,
    ) {}

    async findAll(options?: {
        supplierId?: number;
        status?: DeliveryStatus;
        from?: Date;
        to?: Date;
    }): Promise<Delivery[]> {
        const qb = this.deliveryRepository
            .createQueryBuilder('delivery')
            .leftJoinAndSelect('delivery.supplier', 'supplier')
            .leftJoinAndSelect('delivery.items', 'items')
            .leftJoinAndSelect('items.product', 'product')
            .orderBy('delivery.createdAt', 'DESC');

        if (options?.supplierId) {
            qb.andWhere('delivery.supplierId = :supplierId', {
                supplierId: options.supplierId,
            });
        }
        if (options?.status) {
            qb.andWhere('delivery.status = :status', {
                status: options.status,
            });
        }
        if (options?.from) {
            qb.andWhere('delivery.createdAt >= :from', { from: options.from });
        }
        if (options?.to) {
            qb.andWhere('delivery.createdAt <= :to', { to: options.to });
        }

        return qb.getMany();
    }

    async findOne(id: number): Promise<Delivery> {
        const delivery = await this.deliveryRepository.findOne({
            where: { id },
            relations: ['supplier', 'items', 'items.product', 'receivedBy'],
        });
        if (!delivery) {
            throw new NotFoundException(
                `Dostawa o ID ${id} nie została znaleziona`,
            );
        }
        return delivery;
    }

    async create(dto: CreateDeliveryDto, actor: User): Promise<Delivery> {
        const deliveryNumber = await this.generateDeliveryNumber();

        const delivery = this.deliveryRepository.create({
            deliveryNumber,
            supplierId: dto.supplierId,
            deliveryDate: dto.deliveryDate ? new Date(dto.deliveryDate) : null,
            invoiceNumber: dto.invoiceNumber,
            notes: dto.notes,
            status: DeliveryStatus.Draft,
        });

        const saved = await this.deliveryRepository.save(delivery);

        if (dto.items && dto.items.length > 0) {
            for (const itemDto of dto.items) {
                await this.addItem(saved.id, itemDto);
            }
        }

        await this.logService.logAction(actor, LogAction.DELIVERY_CREATED, {
            entity: 'delivery',
            deliveryId: saved.id,
            deliveryNumber,
        });

        return this.findOne(saved.id);
    }

    async update(
        id: number,
        dto: UpdateDeliveryDto,
        actor: User,
    ): Promise<Delivery> {
        const delivery = await this.findOne(id);

        if (delivery.status === DeliveryStatus.Received) {
            throw new BadRequestException(
                'Nie można edytować przyjętej dostawy',
            );
        }

        Object.assign(delivery, {
            supplierId: dto.supplierId ?? delivery.supplierId,
            deliveryDate: dto.deliveryDate
                ? new Date(dto.deliveryDate)
                : delivery.deliveryDate,
            invoiceNumber: dto.invoiceNumber ?? delivery.invoiceNumber,
            notes: dto.notes ?? delivery.notes,
            status: dto.status ?? delivery.status,
        });

        await this.deliveryRepository.save(delivery);

        await this.logService.logAction(actor, LogAction.DELIVERY_CREATED, {
            entity: 'delivery',
            deliveryId: id,
            action: 'update',
            changes: dto,
        });

        return this.findOne(id);
    }

    async addItem(
        deliveryId: number,
        dto: AddDeliveryItemDto,
    ): Promise<DeliveryItem> {
        const delivery = await this.findOne(deliveryId);

        if (delivery.status === DeliveryStatus.Received) {
            throw new BadRequestException(
                'Nie można dodawać pozycji do przyjętej dostawy',
            );
        }

        const product = await this.productRepository.findOne({
            where: { id: dto.productId },
        });
        if (!product) {
            throw new NotFoundException(
                `Produkt o ID ${dto.productId} nie istnieje`,
            );
        }

        const totalCost = dto.quantity * dto.unitCost;

        const item = this.deliveryItemRepository.create({
            deliveryId,
            productId: dto.productId,
            quantity: dto.quantity,
            unitCost: dto.unitCost,
            totalCost,
            batchNumber: dto.batchNumber,
            expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
        });

        const savedItem = await this.deliveryItemRepository.save(item);
        await this.recalculateTotalCost(deliveryId);

        return savedItem;
    }

    async updateItem(
        deliveryId: number,
        itemId: number,
        dto: UpdateDeliveryItemDto,
    ): Promise<DeliveryItem> {
        const delivery = await this.findOne(deliveryId);

        if (delivery.status === DeliveryStatus.Received) {
            throw new BadRequestException(
                'Nie można edytować pozycji w przyjętej dostawie',
            );
        }

        const item = await this.deliveryItemRepository.findOne({
            where: { id: itemId, deliveryId },
        });
        if (!item) {
            throw new NotFoundException(`Pozycja o ID ${itemId} nie istnieje`);
        }

        if (dto.quantity !== undefined) {
            item.quantity = dto.quantity;
        }
        if (dto.unitCost !== undefined) {
            item.unitCost = dto.unitCost;
        }
        if (dto.batchNumber !== undefined) {
            item.batchNumber = dto.batchNumber;
        }
        if (dto.expiryDate !== undefined) {
            item.expiryDate = dto.expiryDate ? new Date(dto.expiryDate) : null;
        }

        item.totalCost = item.quantity * item.unitCost;

        const savedItem = await this.deliveryItemRepository.save(item);
        await this.recalculateTotalCost(deliveryId);

        return savedItem;
    }

    async removeItem(deliveryId: number, itemId: number): Promise<void> {
        const delivery = await this.findOne(deliveryId);

        if (delivery.status === DeliveryStatus.Received) {
            throw new BadRequestException(
                'Nie można usuwać pozycji z przyjętej dostawy',
            );
        }

        const item = await this.deliveryItemRepository.findOne({
            where: { id: itemId, deliveryId },
        });
        if (!item) {
            throw new NotFoundException(`Pozycja o ID ${itemId} nie istnieje`);
        }

        await this.deliveryItemRepository.remove(item);
        await this.recalculateTotalCost(deliveryId);
    }

    async receive(
        id: number,
        dto: ReceiveDeliveryDto,
        actor: User,
    ): Promise<Delivery> {
        const delivery = await this.findOne(id);

        if (delivery.status === DeliveryStatus.Received) {
            throw new BadRequestException('Dostawa została już przyjęta');
        }

        if (!delivery.items || delivery.items.length === 0) {
            throw new BadRequestException(
                'Dostawa musi zawierać przynajmniej jeden produkt',
            );
        }

        await this.dataSource.transaction(async (manager) => {
            // Update product stocks and create movements
            for (const item of delivery.items) {
                const product = await manager.findOne(Product, {
                    where: { id: item.productId },
                });
                if (!product) continue;

                const quantityBefore = product.stock;
                product.stock += item.quantity;

                await manager.save(product);

                // Create movement record
                const movement = manager.create(ProductMovement, {
                    productId: item.productId,
                    movementType: MovementType.Delivery,
                    quantity: item.quantity,
                    quantityBefore,
                    quantityAfter: product.stock,
                    deliveryId: delivery.id,
                    createdById: actor.id,
                    notes: `Dostawa ${delivery.deliveryNumber}`,
                });
                await manager.save(movement);
            }

            // Update delivery status
            delivery.status = DeliveryStatus.Received;
            delivery.receivedDate = new Date();
            delivery.receivedById = actor.id;
            if (dto.notes) {
                delivery.notes = (delivery.notes || '') + '\n' + dto.notes;
            }
            await manager.save(delivery);
        });

        await this.logService.logAction(actor, LogAction.DELIVERY_RECEIVED, {
            entity: 'delivery',
            deliveryId: id,
            deliveryNumber: delivery.deliveryNumber,
        });

        return this.findOne(id);
    }

    async cancel(id: number, actor: User): Promise<Delivery> {
        const delivery = await this.findOne(id);

        if (delivery.status === DeliveryStatus.Received) {
            throw new BadRequestException(
                'Nie można anulować przyjętej dostawy',
            );
        }

        delivery.status = DeliveryStatus.Cancelled;
        await this.deliveryRepository.save(delivery);

        await this.logService.logAction(actor, LogAction.DELIVERY_CANCELLED, {
            entity: 'delivery',
            deliveryId: id,
            deliveryNumber: delivery.deliveryNumber,
        });

        return delivery;
    }

    private async generateDeliveryNumber(): Promise<string> {
        const now = new Date();
        const prefix = `D${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;

        const lastDelivery = await this.deliveryRepository.findOne({
            where: {},
            order: { id: 'DESC' },
        });

        const nextNum = (lastDelivery?.id || 0) + 1;
        return `${prefix}${String(nextNum).padStart(5, '0')}`;
    }

    private async recalculateTotalCost(deliveryId: number): Promise<void> {
        const items = await this.deliveryItemRepository.find({
            where: { deliveryId },
        });
        const totalCost = items.reduce((sum, item) => sum + item.totalCost, 0);
        await this.deliveryRepository.update(deliveryId, { totalCost });
    }
}
