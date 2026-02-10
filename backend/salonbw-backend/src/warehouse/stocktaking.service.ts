import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Stocktaking, StocktakingStatus } from './entities/stocktaking.entity';
import { StocktakingItem } from './entities/stocktaking-item.entity';
import {
    ProductMovement,
    MovementType,
} from './entities/product-movement.entity';
import { Product } from '../products/product.entity';
import {
    CreateStocktakingDto,
    UpdateStocktakingDto,
    AddStocktakingItemsDto,
    UpdateStocktakingItemDto,
    CompleteStocktakingDto,
} from './dto/stocktaking.dto';
import { LogService } from '../logs/log.service';
import { LogAction } from '../logs/log-action.enum';
import { User } from '../users/user.entity';

@Injectable()
export class StocktakingService {
    constructor(
        @InjectRepository(Stocktaking)
        private readonly stocktakingRepository: Repository<Stocktaking>,
        @InjectRepository(StocktakingItem)
        private readonly stocktakingItemRepository: Repository<StocktakingItem>,
        @InjectRepository(Product)
        private readonly productRepository: Repository<Product>,
        @InjectRepository(ProductMovement)
        private readonly movementRepository: Repository<ProductMovement>,
        private readonly dataSource: DataSource,
        private readonly logService: LogService,
    ) {}

    async findAll(options?: {
        status?: StocktakingStatus;
        from?: Date;
        to?: Date;
    }): Promise<Stocktaking[]> {
        const qb = this.stocktakingRepository
            .createQueryBuilder('stocktaking')
            .leftJoinAndSelect('stocktaking.createdBy', 'createdBy')
            .leftJoinAndSelect('stocktaking.completedBy', 'completedBy')
            .orderBy('stocktaking.createdAt', 'DESC');

        if (options?.status) {
            qb.andWhere('stocktaking.status = :status', {
                status: options.status,
            });
        }
        if (options?.from) {
            qb.andWhere('stocktaking.stocktakingDate >= :from', {
                from: options.from,
            });
        }
        if (options?.to) {
            qb.andWhere('stocktaking.stocktakingDate <= :to', {
                to: options.to,
            });
        }

        return qb.getMany();
    }

    async findHistorySummary(): Promise<
        Array<{
            id: number;
            stocktakingNumber: string;
            stocktakingDate: string;
            productsCount: number;
            shortageCount: number;
            overageCount: number;
            matchedCount: number;
        }>
    > {
        const rows = await this.dataSource.query(
            `
            SELECT
                st.id,
                st."stocktakingNumber",
                st."stocktakingDate",
                COUNT(si.id)::int AS "productsCount",
                SUM(CASE WHEN COALESCE(si.difference, 0) < 0 THEN 1 ELSE 0 END)::int AS "shortageCount",
                SUM(CASE WHEN COALESCE(si.difference, 0) > 0 THEN 1 ELSE 0 END)::int AS "overageCount",
                SUM(CASE WHEN COALESCE(si.difference, 0) = 0 THEN 1 ELSE 0 END)::int AS "matchedCount"
            FROM stocktakings st
            LEFT JOIN stocktaking_items si ON si."stocktakingId" = st.id
            GROUP BY st.id
            ORDER BY st."stocktakingDate" DESC, st.id DESC
            `,
        );

        return rows.map((row: Record<string, unknown>) => ({
            id: Number(row.id),
            stocktakingNumber:
                typeof row.stocktakingNumber === 'string' ||
                typeof row.stocktakingNumber === 'number'
                    ? String(row.stocktakingNumber)
                    : '',
            stocktakingDate:
                row.stocktakingDate instanceof Date
                    ? row.stocktakingDate.toISOString()
                    : typeof row.stocktakingDate === 'string'
                      ? row.stocktakingDate
                      : typeof row.stocktakingDate === 'number'
                        ? new Date(row.stocktakingDate).toISOString()
                        : '',
            productsCount: Number(row.productsCount ?? 0),
            shortageCount: Number(row.shortageCount ?? 0),
            overageCount: Number(row.overageCount ?? 0),
            matchedCount: Number(row.matchedCount ?? 0),
        }));
    }

    async findOne(id: number): Promise<Stocktaking> {
        const stocktaking = await this.stocktakingRepository.findOne({
            where: { id },
            relations: ['items', 'items.product', 'createdBy', 'completedBy'],
        });
        if (!stocktaking) {
            throw new NotFoundException(
                `Inwentaryzacja o ID ${id} nie została znaleziona`,
            );
        }
        return stocktaking;
    }

    async create(dto: CreateStocktakingDto, actor: User): Promise<Stocktaking> {
        const stocktakingNumber = await this.generateStocktakingNumber();

        const stocktaking = this.stocktakingRepository.create({
            stocktakingNumber,
            stocktakingDate: dto.stocktakingDate
                ? new Date(dto.stocktakingDate)
                : new Date(),
            notes: dto.notes,
            status: StocktakingStatus.Draft,
            createdById: actor.id,
        });

        const saved = await this.stocktakingRepository.save(stocktaking);

        await this.logService.logAction(actor, LogAction.STOCKTAKING_CREATED, {
            entity: 'stocktaking',
            stocktakingId: saved.id,
            stocktakingNumber,
        });

        return this.findOne(saved.id);
    }

    async update(
        id: number,
        dto: UpdateStocktakingDto,
        actor: User,
    ): Promise<Stocktaking> {
        const stocktaking = await this.findOne(id);

        if (stocktaking.status === StocktakingStatus.Completed) {
            throw new BadRequestException(
                'Nie można edytować zakończonej inwentaryzacji',
            );
        }

        if (dto.stocktakingDate) {
            stocktaking.stocktakingDate = new Date(dto.stocktakingDate);
        }
        if (dto.notes !== undefined) {
            stocktaking.notes = dto.notes;
        }

        await this.stocktakingRepository.save(stocktaking);

        await this.logService.logAction(actor, LogAction.STOCKTAKING_CREATED, {
            entity: 'stocktaking',
            stocktakingId: id,
            action: 'update',
            changes: dto,
        });

        return this.findOne(id);
    }

    async start(id: number, actor: User): Promise<Stocktaking> {
        const stocktaking = await this.findOne(id);

        if (stocktaking.status !== StocktakingStatus.Draft) {
            throw new BadRequestException(
                'Można rozpocząć tylko inwentaryzację w statusie wersji roboczej',
            );
        }

        // Load all active products and create items with current system quantities
        const products = await this.productRepository.find({
            where: { isActive: true, trackStock: true },
        });

        const items = products.map((product) =>
            this.stocktakingItemRepository.create({
                stocktakingId: id,
                productId: product.id,
                systemQuantity: product.stock,
                countedQuantity: null,
                difference: null,
            }),
        );

        await this.stocktakingItemRepository.save(items);

        stocktaking.status = StocktakingStatus.InProgress;
        await this.stocktakingRepository.save(stocktaking);

        await this.logService.logAction(actor, LogAction.STOCKTAKING_CREATED, {
            entity: 'stocktaking',
            stocktakingId: id,
            action: 'start',
        });

        return this.findOne(id);
    }

    async addItems(
        id: number,
        dto: AddStocktakingItemsDto,
        actor: User,
    ): Promise<Stocktaking> {
        const stocktaking = await this.findOne(id);

        if (stocktaking.status === StocktakingStatus.Completed) {
            throw new BadRequestException(
                'Nie można dodawać pozycji do zakończonej inwentaryzacji',
            );
        }

        for (const itemDto of dto.items) {
            const existingItem = stocktaking.items.find(
                (i) => i.productId === itemDto.productId,
            );

            if (existingItem) {
                // Update existing item
                existingItem.countedQuantity = itemDto.countedQuantity;
                existingItem.difference =
                    itemDto.countedQuantity - existingItem.systemQuantity;
                if (itemDto.notes) {
                    existingItem.notes = itemDto.notes;
                }
                await this.stocktakingItemRepository.save(existingItem);
            } else {
                // Add new item
                const product = await this.productRepository.findOne({
                    where: { id: itemDto.productId },
                });
                if (!product) {
                    throw new NotFoundException(
                        `Produkt o ID ${itemDto.productId} nie istnieje`,
                    );
                }

                const item = this.stocktakingItemRepository.create({
                    stocktakingId: id,
                    productId: itemDto.productId,
                    systemQuantity: product.stock,
                    countedQuantity: itemDto.countedQuantity,
                    difference: itemDto.countedQuantity - product.stock,
                    notes: itemDto.notes,
                });
                await this.stocktakingItemRepository.save(item);
            }
        }

        return this.findOne(id);
    }

    async updateItem(
        stocktakingId: number,
        itemId: number,
        dto: UpdateStocktakingItemDto,
    ): Promise<StocktakingItem> {
        const stocktaking = await this.findOne(stocktakingId);

        if (stocktaking.status === StocktakingStatus.Completed) {
            throw new BadRequestException(
                'Nie można edytować pozycji w zakończonej inwentaryzacji',
            );
        }

        const item = await this.stocktakingItemRepository.findOne({
            where: { id: itemId, stocktakingId },
        });
        if (!item) {
            throw new NotFoundException(`Pozycja o ID ${itemId} nie istnieje`);
        }

        if (dto.countedQuantity !== undefined) {
            item.countedQuantity = dto.countedQuantity;
            item.difference = dto.countedQuantity - item.systemQuantity;
        }
        if (dto.notes !== undefined) {
            item.notes = dto.notes;
        }

        return this.stocktakingItemRepository.save(item);
    }

    async complete(
        id: number,
        dto: CompleteStocktakingDto,
        actor: User,
    ): Promise<Stocktaking> {
        const stocktaking = await this.findOne(id);

        if (stocktaking.status === StocktakingStatus.Completed) {
            throw new BadRequestException(
                'Inwentaryzacja została już zakończona',
            );
        }

        // Check if all items have counted quantities
        const uncountedItems = stocktaking.items.filter(
            (i) => i.countedQuantity === null,
        );
        if (uncountedItems.length > 0) {
            throw new BadRequestException(
                `${uncountedItems.length} produktów nie zostało zinwentaryzowanych`,
            );
        }

        const applyDifferences = dto.applyDifferences !== false;

        await this.dataSource.transaction(async (manager) => {
            if (applyDifferences) {
                for (const item of stocktaking.items) {
                    if (item.difference === null || item.difference === 0)
                        continue;

                    const product = await manager.findOne(Product, {
                        where: { id: item.productId },
                    });
                    if (!product) continue;

                    const quantityBefore = product.stock;
                    product.stock = item.countedQuantity!;

                    await manager.save(product);

                    // Create movement record
                    const movement = manager.create(ProductMovement, {
                        productId: item.productId,
                        movementType: MovementType.Stocktaking,
                        quantity: item.difference,
                        quantityBefore,
                        quantityAfter: product.stock,
                        stocktakingId: stocktaking.id,
                        createdById: actor.id,
                        notes: `Inwentaryzacja ${stocktaking.stocktakingNumber}`,
                    });
                    await manager.save(movement);
                }
            }

            stocktaking.status = StocktakingStatus.Completed;
            stocktaking.completedById = actor.id;
            stocktaking.completedAt = new Date();
            if (dto.notes) {
                stocktaking.notes =
                    (stocktaking.notes || '') + '\n' + dto.notes;
            }
            await manager.save(stocktaking);
        });

        await this.logService.logAction(
            actor,
            LogAction.STOCKTAKING_COMPLETED,
            {
                entity: 'stocktaking',
                stocktakingId: id,
                stocktakingNumber: stocktaking.stocktakingNumber,
                applyDifferences,
            },
        );

        return this.findOne(id);
    }

    async cancel(id: number, actor: User): Promise<Stocktaking> {
        const stocktaking = await this.findOne(id);

        if (stocktaking.status === StocktakingStatus.Completed) {
            throw new BadRequestException(
                'Nie można anulować zakończonej inwentaryzacji',
            );
        }

        stocktaking.status = StocktakingStatus.Cancelled;
        await this.stocktakingRepository.save(stocktaking);

        await this.logService.logAction(
            actor,
            LogAction.STOCKTAKING_COMPLETED,
            {
                entity: 'stocktaking',
                stocktakingId: id,
                action: 'cancel',
                stocktakingNumber: stocktaking.stocktakingNumber,
            },
        );

        return stocktaking;
    }

    async remove(id: number, actor: User): Promise<void> {
        const stocktaking = await this.findOne(id);

        if (stocktaking.status === StocktakingStatus.Completed) {
            throw new BadRequestException(
                'Nie można usunąć zakończonej inwentaryzacji',
            );
        }

        await this.stocktakingRepository.remove(stocktaking);

        await this.logService.logAction(
            actor,
            LogAction.STOCKTAKING_COMPLETED,
            {
                entity: 'stocktaking',
                stocktakingId: id,
                action: 'delete',
                stocktakingNumber: stocktaking.stocktakingNumber,
            },
        );
    }

    private async generateStocktakingNumber(): Promise<string> {
        const now = new Date();
        const prefix = `I${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;

        const lastStocktaking = await this.stocktakingRepository.findOne({
            where: {},
            order: { id: 'DESC' },
        });

        const nextNum = (lastStocktaking?.id || 0) + 1;
        return `${prefix}${String(nextNum).padStart(5, '0')}`;
    }
}
