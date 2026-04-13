import {
    BadRequestException,
    Injectable,
    Logger,
    NotFoundException,
    NotImplementedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { Product } from '../products/product.entity';
import { User } from '../users/user.entity';
import { Appointment } from '../appointments/appointment.entity';
import { CreateSaleDto, CreateSaleItemDto } from './dto/create-sale.dto';
import { ReverseSaleDto } from './dto/reverse-sale.dto';
import { AdjustInventoryDto } from './dto/adjust-inventory.dto';
import { CreateUsageDto } from './dto/create-usage.dto';
import { CommissionsService } from '../commissions/commissions.service';
import { LogService } from '../logs/log.service';
import { PricingService } from '../finance/pricing.service';
import { LogAction } from '../logs/log-action.enum';
import {
    WarehouseSale,
    WarehouseSaleKind,
    WarehouseSaleStatus,
} from '../warehouse/entities/warehouse-sale.entity';
import { WarehouseSaleItem } from '../warehouse/entities/warehouse-sale-item.entity';
import { WarehouseUsage } from '../warehouse/entities/warehouse-usage.entity';
import { WarehouseUsageItem } from '../warehouse/entities/warehouse-usage-item.entity';

interface NormalizedSaleItem {
    product: Product;
    quantity: number;
    unit: string;
    unitPriceGross: number;
    discountGross: number;
}

interface EffectiveQuantity {
    productId: number;
    quantity: number;
}

interface ReversalSelection {
    sourceItem: WarehouseSaleItem;
    quantity: number;
    proportion: number;
}

@Injectable()
export class RetailService {
    private readonly logger = new Logger(RetailService.name);
    private readonly requireCommission: boolean;

    constructor(
        @InjectRepository(Product)
        private readonly products: Repository<Product>,
        @InjectRepository(User)
        private readonly users: Repository<User>,
        @InjectRepository(Appointment)
        private readonly appointments: Repository<Appointment>,
        @InjectRepository(WarehouseSale)
        private readonly warehouseSales: Repository<WarehouseSale>,
        @InjectRepository(WarehouseSaleItem)
        private readonly warehouseSaleItems: Repository<WarehouseSaleItem>,
        @InjectRepository(WarehouseUsage)
        private readonly warehouseUsages: Repository<WarehouseUsage>,
        @InjectRepository(WarehouseUsageItem)
        private readonly warehouseUsageItems: Repository<WarehouseUsageItem>,
        private readonly commissions: CommissionsService,
        private readonly logs: LogService,
        private readonly config: ConfigService,
        private readonly dataSource: DataSource,
        private readonly pricing: PricingService,
    ) {
        this.requireCommission =
            this.config.get<string>('POS_REQUIRE_COMMISSION', 'false') ===
            'true';
    }

    private isEnabled(): boolean {
        return this.config.get<string>('POS_ENABLED', 'false') === 'true';
    }

    private roundMoney(value: number): number {
        return Number(value.toFixed(2));
    }

    private async q<T>(sql: string, params: unknown[]): Promise<T[]> {
        const rows = await this.dataSource.query(sql, params);
        return rows as T[];
    }

    private async hasTable(name: string): Promise<boolean> {
        try {
            const result = await this.q<{ exists: string | null }>(
                'SELECT to_regclass($1) AS exists',
                [name],
            );
            return Boolean(result?.[0]?.exists);
        } catch {
            return false;
        }
    }

    /**
     * priceCents: unit price in cents
     * quantity: number of units
     * discountCents: total discount in cents for line
     * percent: commission percent (e.g., 10 for 10%)
     */
    calculateCommissionCents(
        priceCents: number,
        quantity: number,
        discountCents: number,
        percent: number,
    ): number {
        const totalPriceCents = priceCents * quantity;
        const taxableCents = Math.max(0, totalPriceCents - discountCents);
        return Math.floor((taxableCents * percent) / 100);
    }

    private async normalizeSaleItems(
        dto: CreateSaleDto,
    ): Promise<NormalizedSaleItem[]> {
        const rawItems: CreateSaleItemDto[] =
            dto.items && dto.items.length > 0
                ? dto.items
                : dto.productId
                  ? [
                        {
                            productId: dto.productId,
                            quantity: dto.quantity ?? 1,
                            unitPrice: dto.unitPrice,
                            unitPriceCents: dto.unitPriceCents,
                            discount: dto.discount,
                            discountCents: dto.discountCents,
                        },
                    ]
                  : [];

        if (rawItems.length === 0) {
            throw new BadRequestException('Sale requires at least one item');
        }

        const productIds = Array.from(
            new Set(rawItems.map((item) => item.productId)),
        );
        const products = await this.products.find({
            where: {
                id: In(productIds),
            },
        });

        const productsById = new Map(
            products.map((product) => [product.id, product]),
        );

        return rawItems.map((item) => {
            if (!item.productId || item.productId <= 0) {
                throw new BadRequestException('Invalid productId');
            }
            const product = productsById.get(item.productId);
            if (!product) {
                throw new NotFoundException(
                    `Product ${item.productId} not found`,
                );
            }
            if (!Number.isFinite(item.quantity) || item.quantity < 1) {
                throw new BadRequestException('quantity must be >= 1');
            }

            const unitPriceGross =
                item.unitPriceCents !== undefined
                    ? Number(item.unitPriceCents) / 100
                    : item.unitPrice !== undefined
                      ? Number(item.unitPrice)
                      : Number(product.unitPrice ?? 0);

            const discountGross =
                item.discountCents !== undefined
                    ? Number(item.discountCents) / 100
                    : item.discount !== undefined
                      ? Number(item.discount)
                      : 0;

            if (unitPriceGross < 0 || discountGross < 0) {
                throw new BadRequestException(
                    'unitPrice/discount must be >= 0',
                );
            }

            return {
                product,
                quantity: Number(item.quantity),
                unit: item.unit ?? product.unit ?? 'op.',
                unitPriceGross,
                discountGross,
            };
        });
    }

    private aggregateSaleQuantities(
        items: NormalizedSaleItem[],
    ): EffectiveQuantity[] {
        const quantities = new Map<number, number>();

        for (const item of items) {
            quantities.set(
                item.product.id,
                (quantities.get(item.product.id) ?? 0) + item.quantity,
            );
        }

        return Array.from(quantities.entries()).map(
            ([productId, quantity]) => ({
                productId,
                quantity,
            }),
        );
    }

    private aggregateUsageQuantities(
        items: CreateUsageDto['items'],
    ): EffectiveQuantity[] {
        const quantities = new Map<number, number>();

        for (const item of items) {
            quantities.set(
                item.productId,
                (quantities.get(item.productId) ?? 0) + item.quantity,
            );
        }

        return Array.from(quantities.entries()).map(
            ([productId, quantity]) => ({
                productId,
                quantity,
            }),
        );
    }

    private formatSaleNumber(id: number): string {
        const now = new Date();
        const prefix = `S${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
        return `${prefix}${String(id).padStart(5, '0')}`;
    }

    private formatUsageNumber(id: number): string {
        const now = new Date();
        const prefix = `U${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
        return `${prefix}${String(id).padStart(5, '0')}`;
    }

    async insertProductSale(
        manager: EntityManager,
        productId: number,
        quantity: number,
        unitPriceCents: number,
        discountCents: number,
        soldAt: Date,
        employeeId: number | null,
        appointmentId: number | null,
        note: string | null,
        warehouseSaleId: number | null,
        warehouseSaleItemId: number | null,
    ): Promise<number | null> {
        const unitPriceDecimal = (unitPriceCents / 100).toFixed(2);
        const discountDecimal = (discountCents / 100).toFixed(2);
        const rows = await manager.query(
            `INSERT INTO product_sales (productId, soldAt, quantity, unitPrice, discount, employeeId, appointmentId, note, "warehouseSaleId", "warehouseSaleItemId")
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             RETURNING id`,
            [
                productId,
                soldAt,
                quantity,
                unitPriceDecimal,
                discountDecimal,
                employeeId,
                appointmentId,
                note,
                warehouseSaleId,
                warehouseSaleItemId,
            ],
        );
        return Number(rows?.[0]?.id ?? 0) || null;
    }

    private async getSaleForReversal(id: number): Promise<WarehouseSale> {
        if (!(await this.hasTable('public.warehouse_sales'))) {
            throw new NotFoundException(`Sale ${id} not found`);
        }

        const sale = await this.warehouseSales.findOne({
            where: { id },
            relations: ['items', 'employee', 'createdBy'],
        });
        if (!sale) {
            throw new NotFoundException(`Sale ${id} not found`);
        }
        if (sale.sourceSaleId) {
            throw new BadRequestException('Cannot reverse a reversal entry');
        }
        return sale;
    }

    private async getReversedQuantities(
        sourceSaleId: number,
    ): Promise<Map<number, number>> {
        const reversals = await this.warehouseSales.find({
            where: { sourceSaleId },
            relations: ['items'],
        });

        const reversed = new Map<number, number>();
        for (const reversal of reversals) {
            for (const item of reversal.items) {
                if (!item.originalSaleItemId) continue;
                reversed.set(
                    item.originalSaleItemId,
                    (reversed.get(item.originalSaleItemId) ?? 0) +
                        Math.abs(Number(item.quantity ?? 0)),
                );
            }
        }
        return reversed;
    }

    private async resolveReversalSelection(
        sourceSale: WarehouseSale,
        dto: ReverseSaleDto,
    ): Promise<ReversalSelection[]> {
        const reversedQuantities = await this.getReversedQuantities(
            sourceSale.id,
        );
        const positiveItems = sourceSale.items.filter(
            (item) => Number(item.quantity ?? 0) > 0,
        );

        const requestedItems =
            dto.items && dto.items.length > 0
                ? dto.items
                : positiveItems
                      .map((item) => {
                          const reversed = reversedQuantities.get(item.id) ?? 0;
                          const remaining =
                              Number(item.quantity ?? 0) - reversed;
                          if (remaining <= 0) return null;
                          return {
                              saleItemId: item.id,
                              quantity: remaining,
                          };
                      })
                      .filter(
                          (
                              item,
                          ): item is { saleItemId: number; quantity: number } =>
                              item !== null,
                      );

        if (requestedItems.length === 0) {
            throw new BadRequestException('No sale items available to reverse');
        }

        return requestedItems.map((requested) => {
            const sourceItem = positiveItems.find(
                (item) => item.id === requested.saleItemId,
            );
            if (!sourceItem) {
                throw new BadRequestException(
                    `Sale item ${requested.saleItemId} not found in source sale`,
                );
            }

            const originalQuantity = Number(sourceItem.quantity ?? 0);
            const reversed = reversedQuantities.get(sourceItem.id) ?? 0;
            const remaining = originalQuantity - reversed;
            if (remaining <= 0) {
                throw new BadRequestException(
                    `Sale item ${sourceItem.id} has no remaining quantity to reverse`,
                );
            }
            if (requested.quantity > remaining) {
                throw new BadRequestException(
                    `Sale item ${sourceItem.id} can reverse at most ${remaining} units`,
                );
            }

            return {
                sourceItem,
                quantity: requested.quantity,
                proportion: requested.quantity / originalQuantity,
            };
        });
    }

    private isFullReversal(
        sourceSale: WarehouseSale,
        selections: ReversalSelection[],
    ): boolean {
        const positiveItems = sourceSale.items.filter(
            (item) => Number(item.quantity ?? 0) > 0,
        );
        if (selections.length !== positiveItems.length) {
            return false;
        }
        return positiveItems.every((item) => {
            const selected = selections.find(
                (selection) => selection.sourceItem.id === item.id,
            );
            return (
                selected !== undefined &&
                selected.quantity === Number(item.quantity ?? 0)
            );
        });
    }

    private async getSourceCommissionForSaleItem(
        manager: EntityManager,
        sourceSaleItemId: number,
    ): Promise<{ amount: number; percent: number } | null> {
        if (!(await this.hasTable('public.product_sales'))) {
            return null;
        }

        const rows = await manager.query(
            `SELECT c.amount, c.percent
             FROM product_sales ps
             LEFT JOIN commissions c ON c."productSaleId" = ps.id
             WHERE ps."warehouseSaleItemId" = $1
             ORDER BY ps.id DESC
             LIMIT 1`,
            [sourceSaleItemId],
        );
        const row = rows?.[0];
        if (!row || row.amount === null || row.amount === undefined) {
            return null;
        }
        return {
            amount: Number(row.amount ?? 0),
            percent: Number(row.percent ?? 0),
        };
    }

    private async createReversalCommissionForSaleItem(
        manager: EntityManager,
        sourceSale: WarehouseSale,
        selection: ReversalSelection,
        product: Product,
        reversalProductSaleId: number | null,
        actor: User,
    ) {
        if (!sourceSale.employeeId) return;

        const employee =
            sourceSale.employee ??
            (await this.users.findOne({
                where: { id: sourceSale.employeeId },
            }));
        if (!employee) return;

        const sourceCommission = await this.getSourceCommissionForSaleItem(
            manager,
            selection.sourceItem.id,
        );

        let amount: number;
        let percent: number;
        if (sourceCommission) {
            amount = -this.roundMoney(
                sourceCommission.amount * selection.proportion,
            );
            percent = sourceCommission.percent;
        } else {
            const rawPercent = this.config.get<string | number>(
                'PRODUCT_COMMISSION_PERCENT',
            );
            const percentFromEnv =
                rawPercent !== undefined && rawPercent !== null
                    ? Number(rawPercent)
                    : NaN;
            percent = !Number.isNaN(percentFromEnv)
                ? percentFromEnv
                : Number(employee.commissionBase ?? 0);
            amount =
                -this.calculateCommissionCents(
                    Math.round(selection.sourceItem.unitPriceGross * 100),
                    selection.quantity,
                    Math.round(
                        Number(selection.sourceItem.discountGross ?? 0) *
                            selection.proportion *
                            100,
                    ),
                    percent,
                ) / 100;
        }

        if (amount === 0) {
            return;
        }

        await this.commissions.create(
            {
                employee,
                appointment: null,
                product,
                productSaleId: reversalProductSaleId,
                amount,
                percent,
            },
            actor,
            manager,
        );
    }

    async insertInventoryMovement(
        manager: EntityManager,
        productId: number,
        delta: number,
        reason: string,
        referenceType: string | null,
        referenceId: number | null,
        note: string | null,
        actorId: number | null,
    ) {
        await manager.query(
            `INSERT INTO inventory_movements (productId, delta, reason, referenceType, referenceId, note, createdAt, actorId)
             VALUES ($1, $2, $3, $4, $5, $6, now(), $7)`,
            [
                productId,
                delta,
                reason,
                referenceType,
                referenceId,
                note,
                actorId,
            ],
        );
    }

    async createSale(dto: CreateSaleDto, actor: User) {
        if (!this.isEnabled()) {
            throw new NotImplementedException('POS is disabled');
        }

        const items = await this.normalizeSaleItems(dto);
        const effectiveSaleQuantities = this.aggregateSaleQuantities(items);
        const normalizedItemsByProductId = new Map(
            items.map((item) => [item.product.id, item.product]),
        );

        for (const entry of effectiveSaleQuantities) {
            const product = normalizedItemsByProductId.get(entry.productId);
            if (!product) {
                throw new NotFoundException(
                    `Product ${entry.productId} not found`,
                );
            }
            if (product.stock < entry.quantity) {
                throw new BadRequestException(
                    `Insufficient stock for product ${entry.productId}`,
                );
            }
        }

        const writeProductSales = await this.hasTable('public.product_sales');
        const writeInventoryMovements = await this.hasTable(
            'public.inventory_movements',
        );

        const sale = await this.dataSource.transaction(async (manager) => {
            const soldAt = dto.soldAt ? new Date(dto.soldAt) : new Date();
            const lockedProducts = await manager.find(Product, {
                where: {
                    id: In(
                        effectiveSaleQuantities.map((entry) => entry.productId),
                    ),
                },
                lock: { mode: 'pessimistic_write' },
            });
            const productsById = new Map(
                lockedProducts.map((product) => [product.id, product]),
            );

            for (const entry of effectiveSaleQuantities) {
                const product = productsById.get(entry.productId);
                if (!product) {
                    throw new NotFoundException(
                        `Product ${entry.productId} not found`,
                    );
                }
                if (product.stock < entry.quantity) {
                    throw new BadRequestException(
                        `Insufficient stock for product ${entry.productId}`,
                    );
                }
            }

            const created = manager.create(WarehouseSale, {
                saleNumber: `TEMP-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`,
                soldAt,
                clientName: dto.clientName ?? null,
                clientId: null,
                employeeId: dto.employeeId ?? null,
                appointmentId: dto.appointmentId ?? null,
                kind: WarehouseSaleKind.Sale,
                status: WarehouseSaleStatus.Active,
                sourceSaleId: null,
                reversalReason: null,
                discountGross: 0,
                totalNet: 0,
                totalGross: 0,
                paymentMethod: dto.paymentMethod ?? null,
                notes: dto.note ?? null,
                createdById: actor.id ?? null,
            });
            await manager.save(created);
            created.saleNumber = this.formatSaleNumber(created.id);

            let totalDiscount = 0;
            let totalNet = 0;
            let totalGross = 0;
            const dirtyProducts = new Set<number>();

            for (const item of items) {
                const product = productsById.get(item.product.id);
                if (!product) {
                    throw new NotFoundException(
                        `Product ${item.product.id} not found`,
                    );
                }
                if (product.stock < item.quantity) {
                    throw new BadRequestException(
                        `Insufficient stock for product ${product.id}`,
                    );
                }

                const vatRate = Number(product.vatRate ?? 23);
                const grossBeforeDiscount = item.unitPriceGross * item.quantity;
                const discountGross = Math.min(
                    grossBeforeDiscount,
                    Math.max(0, item.discountGross),
                );
                const lineGross = grossBeforeDiscount - discountGross;
                const divider = 1 + vatRate / 100;
                const lineNet = lineGross / divider;
                const unitNet = item.unitPriceGross / divider;

                const stockBefore = product.stock;
                product.stock -= item.quantity;
                dirtyProducts.add(product.id);

                const saleItem = manager.create(WarehouseSaleItem, {
                    saleId: created.id,
                    productId: product.id,
                    originalSaleItemId: null,
                    productName: product.name,
                    quantity: item.quantity,
                    unit: item.unit,
                    unitPriceNet: this.roundMoney(unitNet),
                    unitPriceGross: this.roundMoney(item.unitPriceGross),
                    vatRate: this.roundMoney(vatRate),
                    discountGross: this.roundMoney(discountGross),
                    totalNet: this.roundMoney(lineNet),
                    totalGross: this.roundMoney(lineGross),
                });
                await manager.save(saleItem);

                try {
                    if (writeProductSales) {
                        const productSaleId = await this.insertProductSale(
                            manager,
                            product.id,
                            item.quantity,
                            Math.round(item.unitPriceGross * 100),
                            Math.round(discountGross * 100),
                            soldAt,
                            dto.employeeId ?? null,
                            dto.appointmentId ?? null,
                            dto.note ?? null,
                            created.id,
                            saleItem.id,
                        );
                        await this.createCommissionForSaleItem(
                            manager,
                            dto,
                            product,
                            Math.round(item.unitPriceGross * 100),
                            item.quantity,
                            Math.round(discountGross * 100),
                            actor,
                            productSaleId,
                        );
                    } else {
                        await this.createCommissionForSaleItem(
                            manager,
                            dto,
                            product,
                            Math.round(item.unitPriceGross * 100),
                            item.quantity,
                            Math.round(discountGross * 100),
                            actor,
                            null,
                        );
                    }
                } catch (error) {
                    const context = `product=${product.id} employee=${dto.employeeId ?? 'n/a'} appointment=${dto.appointmentId ?? 'n/a'}`;
                    this.logger.error(
                        `Failed to create POS commission (${context})`,
                        error instanceof Error ? error.stack : undefined,
                    );
                    if (this.requireCommission) {
                        throw error;
                    }
                }

                if (writeInventoryMovements) {
                    await this.insertInventoryMovement(
                        manager,
                        product.id,
                        -item.quantity,
                        'sale',
                        'warehouse_sale',
                        created.id,
                        dto.note ?? null,
                        actor.id ?? null,
                    );
                }

                totalDiscount += discountGross;
                totalNet += lineNet;
                totalGross += lineGross;

                this.logger.debug(
                    `Recorded sale item product=${product.id} quantity=${item.quantity} stockBefore=${stockBefore} stockAfter=${product.stock}`,
                );
            }

            if (dirtyProducts.size > 0) {
                await manager.save(
                    lockedProducts.filter((product) =>
                        dirtyProducts.has(product.id),
                    ),
                );
            }

            created.discountGross = this.roundMoney(totalDiscount);
            created.totalNet = this.roundMoney(totalNet);
            created.totalGross = this.roundMoney(totalGross);
            await manager.save(created);

            return created;
        });

        try {
            await this.logs.logAction(actor, LogAction.PRODUCT_UPDATED, {
                entity: 'warehouse_sale',
                saleId: sale.id,
                saleNumber: sale.saleNumber,
                itemsCount: items.length,
            });
        } catch {
            // non-fatal log error
        }

        return this.getSaleDetails(sale.id);
    }

    async voidSale(id: number, dto: ReverseSaleDto, actor: User) {
        const sourceSale = await this.getSaleForReversal(id);
        if (sourceSale.status === WarehouseSaleStatus.Voided) {
            throw new BadRequestException('Sale is already voided');
        }
        const existingReversals = await this.warehouseSales.count({
            where: { sourceSaleId: sourceSale.id },
        });
        if (existingReversals > 0) {
            throw new BadRequestException(
                'Void is allowed only before any refund or correction exists',
            );
        }
        return this.createReversalSale(
            sourceSale,
            dto,
            actor,
            WarehouseSaleKind.Void,
        );
    }

    async refundSale(id: number, dto: ReverseSaleDto, actor: User) {
        const sourceSale = await this.getSaleForReversal(id);
        if (sourceSale.status === WarehouseSaleStatus.Voided) {
            throw new BadRequestException('Voided sale cannot be refunded');
        }
        return this.createReversalSale(
            sourceSale,
            dto,
            actor,
            WarehouseSaleKind.Refund,
        );
    }

    async correctSale(id: number, dto: ReverseSaleDto, actor: User) {
        const sourceSale = await this.getSaleForReversal(id);
        if (sourceSale.status === WarehouseSaleStatus.Voided) {
            throw new BadRequestException('Voided sale cannot be corrected');
        }
        return this.createReversalSale(
            sourceSale,
            dto,
            actor,
            WarehouseSaleKind.Correction,
        );
    }

    private async createReversalSale(
        sourceSale: WarehouseSale,
        dto: ReverseSaleDto,
        actor: User,
        kind: WarehouseSaleKind,
    ) {
        const selections = await this.resolveReversalSelection(sourceSale, dto);
        const fullReversal = this.isFullReversal(sourceSale, selections);
        if (kind === WarehouseSaleKind.Void && !fullReversal) {
            throw new BadRequestException(
                'Void must reverse the full remaining sale quantity',
            );
        }

        const restock = dto.restock ?? true;
        const reverseCommission = dto.reverseCommission ?? true;
        const soldAt = dto.soldAt ? new Date(dto.soldAt) : new Date();
        const writeProductSales = await this.hasTable('public.product_sales');
        const writeInventoryMovements = await this.hasTable(
            'public.inventory_movements',
        );

        const reversal = await this.dataSource.transaction(async (manager) => {
            const lockedSourceSale = await manager.findOne(WarehouseSale, {
                where: { id: sourceSale.id },
                lock: { mode: 'pessimistic_write' },
            });
            if (!lockedSourceSale) {
                throw new NotFoundException(`Sale ${sourceSale.id} not found`);
            }

            // Re-check status inside transaction to guard against race conditions
            if (lockedSourceSale.status === WarehouseSaleStatus.Voided) {
                if (kind === WarehouseSaleKind.Void) {
                    throw new BadRequestException('Sale is already voided');
                }
                throw new BadRequestException('Voided sale cannot be reversed');
            }
            if (kind === WarehouseSaleKind.Void) {
                const existingCount = await manager.count(WarehouseSale, {
                    where: { sourceSaleId: sourceSale.id },
                });
                if (existingCount > 0) {
                    throw new BadRequestException(
                        'Void is allowed only before any refund or correction exists',
                    );
                }
            }

            const productIds = Array.from(
                new Set(
                    selections
                        .map((selection) => selection.sourceItem.productId)
                        .filter((productId): productId is number =>
                            Number.isFinite(productId),
                        ),
                ),
            );
            const lockedProducts = productIds.length
                ? await manager.find(Product, {
                      where: { id: In(productIds) },
                      lock: { mode: 'pessimistic_write' },
                  })
                : [];
            const productsById = new Map(
                lockedProducts.map((product) => [product.id, product]),
            );

            const created = manager.create(WarehouseSale, {
                saleNumber: `TEMP-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`,
                soldAt,
                clientName: sourceSale.clientName ?? null,
                clientId: sourceSale.clientId ?? null,
                employeeId: sourceSale.employeeId ?? null,
                appointmentId: sourceSale.appointmentId ?? null,
                kind,
                status: WarehouseSaleStatus.Active,
                sourceSaleId: sourceSale.id,
                reversalReason: dto.reason ?? null,
                discountGross: 0,
                totalNet: 0,
                totalGross: 0,
                paymentMethod: sourceSale.paymentMethod ?? null,
                notes: dto.reason ?? sourceSale.notes ?? null,
                createdById: actor.id ?? null,
            });
            await manager.save(created);
            created.saleNumber = this.formatSaleNumber(created.id);

            const dirtyProducts = new Set<number>();
            let totalDiscount = 0;
            let totalNet = 0;
            let totalGross = 0;

            for (const selection of selections) {
                const sourceItem = selection.sourceItem;
                const product = sourceItem.productId
                    ? (productsById.get(sourceItem.productId) ?? null)
                    : null;

                if (restock && sourceItem.productId && !product) {
                    throw new NotFoundException(
                        `Product ${sourceItem.productId} not found`,
                    );
                }

                const lineDiscount = this.roundMoney(
                    Number(sourceItem.discountGross ?? 0) *
                        selection.proportion,
                );
                const lineNet = this.roundMoney(
                    Number(sourceItem.totalNet ?? 0) * selection.proportion,
                );
                const lineGross = this.roundMoney(
                    Number(sourceItem.totalGross ?? 0) * selection.proportion,
                );

                if (restock && product) {
                    product.stock += selection.quantity;
                    dirtyProducts.add(product.id);
                }

                const reversalItem = manager.create(WarehouseSaleItem, {
                    saleId: created.id,
                    productId: sourceItem.productId ?? null,
                    originalSaleItemId: sourceItem.id,
                    productName: sourceItem.productName,
                    quantity: -selection.quantity,
                    unit: sourceItem.unit,
                    unitPriceNet: Number(sourceItem.unitPriceNet ?? 0),
                    unitPriceGross: Number(sourceItem.unitPriceGross ?? 0),
                    vatRate: Number(sourceItem.vatRate ?? 0),
                    discountGross: -lineDiscount,
                    totalNet: -lineNet,
                    totalGross: -lineGross,
                });
                await manager.save(reversalItem);

                let reversalProductSaleId: number | null = null;
                if (writeProductSales && sourceItem.productId) {
                    reversalProductSaleId = await this.insertProductSale(
                        manager,
                        sourceItem.productId,
                        -selection.quantity,
                        Math.round(
                            Number(sourceItem.unitPriceGross ?? 0) * 100,
                        ),
                        Math.round(-lineDiscount * 100),
                        soldAt,
                        sourceSale.employeeId ?? null,
                        sourceSale.appointmentId ?? null,
                        dto.reason ?? sourceSale.notes ?? null,
                        created.id,
                        reversalItem.id,
                    );
                }

                if (
                    restock &&
                    sourceItem.productId &&
                    writeInventoryMovements
                ) {
                    await this.insertInventoryMovement(
                        manager,
                        sourceItem.productId,
                        selection.quantity,
                        kind === WarehouseSaleKind.Void
                            ? 'sale_void'
                            : kind === WarehouseSaleKind.Refund
                              ? 'sale_refund'
                              : 'sale_correction',
                        'warehouse_sale',
                        created.id,
                        dto.reason ?? sourceSale.notes ?? null,
                        actor.id ?? null,
                    );
                }

                if (reverseCommission && product && sourceSale.employeeId) {
                    await this.createReversalCommissionForSaleItem(
                        manager,
                        sourceSale,
                        selection,
                        product,
                        reversalProductSaleId,
                        actor,
                    );
                }

                totalDiscount += -lineDiscount;
                totalNet += -lineNet;
                totalGross += -lineGross;
            }

            if (dirtyProducts.size > 0) {
                await manager.save(
                    lockedProducts.filter((product) =>
                        dirtyProducts.has(product.id),
                    ),
                );
            }

            created.discountGross = this.roundMoney(totalDiscount);
            created.totalNet = this.roundMoney(totalNet);
            created.totalGross = this.roundMoney(totalGross);
            await manager.save(created);

            lockedSourceSale.status =
                kind === WarehouseSaleKind.Void
                    ? WarehouseSaleStatus.Voided
                    : kind === WarehouseSaleKind.Refund && fullReversal
                      ? WarehouseSaleStatus.Refunded
                      : WarehouseSaleStatus.Adjusted;
            await manager.save(lockedSourceSale);

            return created;
        });

        try {
            await this.logs.logAction(actor, LogAction.PRODUCT_UPDATED, {
                entity: 'warehouse_sale',
                saleId: sourceSale.id,
                reversalSaleId: reversal.id,
                kind,
                reason: dto.reason ?? null,
            });
        } catch {
            // non-fatal log error
        }

        return this.getSaleDetails(reversal.id);
    }

    async listSales(
        params: {
            page?: number;
            pageSize?: number;
            search?: string;
            kind?: string;
        } = {},
    ) {
        if (!(await this.hasTable('public.warehouse_sales'))) {
            return { items: [], total: 0, page: 1, totalPages: 0 };
        }

        const page = Math.max(1, params.page ?? 1);
        const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));

        const qb = this.warehouseSales
            .createQueryBuilder('sale')
            .leftJoinAndSelect('sale.items', 'items')
            .leftJoinAndSelect('sale.employee', 'employee')
            .leftJoinAndSelect('sale.createdBy', 'createdBy')
            .orderBy('sale.soldAt', 'DESC')
            .addOrderBy('sale.id', 'DESC')
            .skip((page - 1) * pageSize)
            .take(pageSize);

        if (params.search?.trim()) {
            const term = `%${params.search.trim().toLowerCase()}%`;
            qb.andWhere(
                '(LOWER(sale.saleNumber) LIKE :term OR LOWER(sale.clientName) LIKE :term)',
                { term },
            );
        }

        if (params.kind && params.kind !== 'all') {
            qb.andWhere('sale.kind = :kind', { kind: params.kind });
        }

        const [items, total] = await qb.getManyAndCount();
        return { items, total, page, totalPages: Math.ceil(total / pageSize) };
    }

    async getSaleDetails(id: number) {
        if (!(await this.hasTable('public.warehouse_sales'))) {
            throw new NotFoundException(`Sale ${id} not found`);
        }

        const sale = await this.warehouseSales.findOne({
            where: { id },
            relations: ['items', 'items.product', 'employee', 'createdBy'],
        });
        if (!sale) {
            throw new NotFoundException(`Sale ${id} not found`);
        }

        const totalItems = sale.items.reduce(
            (sum, item) => sum + Number(item.quantity ?? 0),
            0,
        );

        return {
            ...sale,
            summary: {
                totalItems,
                totalNet: Number(sale.totalNet ?? 0),
                totalGross: Number(sale.totalGross ?? 0),
                discountGross: Number(sale.discountGross ?? 0),
            },
        };
    }

    async createUsage(dto: CreateUsageDto, actor: User) {
        if (!this.isEnabled()) {
            throw new NotImplementedException('POS is disabled');
        }

        if (!dto.items || dto.items.length === 0) {
            throw new BadRequestException('Usage requires at least one item');
        }

        const ids = Array.from(
            new Set(dto.items.map((item) => item.productId)),
        );
        const effectiveUsageQuantities = this.aggregateUsageQuantities(
            dto.items,
        );
        const products = await this.products.find({
            where: {
                id: In(ids),
            },
        });
        const productsById = new Map(
            products.map((product) => [product.id, product]),
        );

        const isPlanned = dto.scope === 'planned';
        for (const item of dto.items) {
            if (item.quantity < 1) {
                throw new BadRequestException('quantity must be >= 1');
            }
        }
        for (const entry of effectiveUsageQuantities) {
            const product = productsById.get(entry.productId);
            if (!product) {
                throw new NotFoundException(
                    `Product ${entry.productId} not found`,
                );
            }
            if (!isPlanned && product.stock < entry.quantity) {
                throw new BadRequestException(
                    `Insufficient stock for product ${entry.productId}`,
                );
            }
        }

        const writeInventoryMovements = await this.hasTable(
            'public.inventory_movements',
        );

        const usage = await this.dataSource.transaction(async (manager) => {
            const lockedProducts = await manager.find(Product, {
                where: {
                    id: In(
                        effectiveUsageQuantities.map(
                            (entry) => entry.productId,
                        ),
                    ),
                },
                lock: { mode: 'pessimistic_write' },
            });
            const lockedProductsById = new Map(
                lockedProducts.map((product) => [product.id, product]),
            );

            for (const entry of effectiveUsageQuantities) {
                const product = lockedProductsById.get(entry.productId);
                if (!product) {
                    throw new NotFoundException(
                        `Product ${entry.productId} not found`,
                    );
                }
                if (!isPlanned && product.stock < entry.quantity) {
                    throw new BadRequestException(
                        `Insufficient stock for product ${entry.productId}`,
                    );
                }
            }

            const created = manager.create(WarehouseUsage, {
                usageNumber: `TEMP-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`,
                usedAt:
                    isPlanned && dto.plannedFor
                        ? new Date(dto.plannedFor)
                        : new Date(),
                clientName: dto.clientName ?? null,
                clientId: null,
                employeeId: dto.employeeId ?? null,
                appointmentId: dto.appointmentId ?? null,
                notes: dto.note ?? null,
                createdById: actor.id ?? null,
            });
            await manager.save(created);
            created.usageNumber = this.formatUsageNumber(created.id);
            await manager.save(created);
            const dirtyProducts = new Set<number>();

            for (const item of dto.items) {
                const product = lockedProductsById.get(item.productId);
                if (!product) {
                    throw new NotFoundException(
                        `Product ${item.productId} not found`,
                    );
                }

                const stockBefore = product.stock;
                if (!isPlanned && stockBefore < item.quantity) {
                    throw new BadRequestException(
                        `Insufficient stock for product ${item.productId}`,
                    );
                }
                const stockAfter = isPlanned
                    ? stockBefore
                    : stockBefore - item.quantity;
                if (!isPlanned) {
                    product.stock = stockAfter;
                    dirtyProducts.add(product.id);
                }

                const usageItem = manager.create(WarehouseUsageItem, {
                    usageId: created.id,
                    productId: product.id,
                    productName: product.name,
                    quantity: item.quantity,
                    unit: item.unit ?? product.unit ?? 'op.',
                    stockBefore,
                    stockAfter,
                });
                await manager.save(usageItem);

                if (writeInventoryMovements && !isPlanned) {
                    await this.insertInventoryMovement(
                        manager,
                        product.id,
                        -item.quantity,
                        'usage',
                        'warehouse_usage',
                        created.id,
                        dto.note ?? null,
                        actor.id ?? null,
                    );
                }
            }

            if (!isPlanned && dirtyProducts.size > 0) {
                await manager.save(
                    lockedProducts.filter((product) =>
                        dirtyProducts.has(product.id),
                    ),
                );
            }

            return created;
        });

        try {
            await this.logs.logAction(actor, LogAction.PRODUCT_UPDATED, {
                entity: 'warehouse_usage',
                usageId: usage.id,
                usageNumber: usage.usageNumber,
                itemsCount: dto.items.length,
            });
        } catch {
            // non-fatal log error
        }

        return this.getUsageDetails(usage.id);
    }

    async listUsage(scope: 'all' | 'planned' | 'completed' = 'all') {
        if (!(await this.hasTable('public.warehouse_usages'))) {
            return [];
        }
        const query = this.warehouseUsages
            .createQueryBuilder('usage')
            .leftJoinAndSelect('usage.items', 'items')
            .leftJoinAndSelect('usage.employee', 'employee')
            .leftJoinAndSelect('usage.createdBy', 'createdBy')
            .orderBy('usage.usedAt', 'DESC')
            .addOrderBy('usage.id', 'DESC');

        if (scope === 'planned') {
            query.andWhere('usage.usedAt > NOW()');
        } else if (scope === 'completed') {
            query.andWhere('usage.usedAt <= NOW()');
        }

        return query.getMany();
    }

    async getUsageDetails(id: number) {
        if (!(await this.hasTable('public.warehouse_usages'))) {
            throw new NotFoundException(`Usage ${id} not found`);
        }

        const usage = await this.warehouseUsages.findOne({
            where: { id },
            relations: ['items', 'items.product', 'employee', 'createdBy'],
        });
        if (!usage) {
            throw new NotFoundException(`Usage ${id} not found`);
        }

        const totalItems = usage.items.reduce(
            (sum, item) => sum + Number(item.quantity ?? 0),
            0,
        );

        return {
            ...usage,
            summary: {
                totalItems,
            },
        };
    }

    async adjustInventory(dto: AdjustInventoryDto, actor: User) {
        if (!this.isEnabled()) {
            throw new NotImplementedException('POS is disabled');
        }

        const product = await this.products.findOne({
            where: { id: dto.productId },
        });
        if (!product) {
            throw new BadRequestException('Invalid productId');
        }

        const writeInventoryMovements = await this.hasTable(
            'public.inventory_movements',
        );

        await this.dataSource.transaction(async (manager) => {
            const nextStock = product.stock + dto.delta;
            await manager.update(Product, product.id, {
                stock: nextStock,
            });

            if (writeInventoryMovements) {
                await this.insertInventoryMovement(
                    manager,
                    product.id,
                    dto.delta,
                    dto.reason,
                    null,
                    null,
                    dto.note ?? null,
                    actor.id ?? null,
                );
            }
        });

        try {
            await this.logs.logAction(actor, LogAction.PRODUCT_UPDATED, {
                entity: 'product',
                productId: product.id,
                change: 'adjust',
                delta: dto.delta,
                reason: dto.reason,
            });
        } catch {
            // non-fatal log error
        }

        return { status: 'ok' } as const;
    }

    async getInventoryLevels() {
        const rows = await this.products.find({
            order: { name: 'ASC' },
        });
        return rows.map((r) => ({
            id: r.id,
            name: r.name,
            brand: r.brand,
            unitPrice: Number(r.unitPrice),
            stock: r.stock,
        }));
    }

    async getSalesSummary(params?: { from?: Date; to?: Date }) {
        const to = params?.to ?? new Date();
        const from =
            params?.from ?? new Date(to.getTime() - 24 * 60 * 60 * 1000);

        if (await this.hasTable('public.product_sales')) {
            const res = await this.q<{
                units: number | string | null;
                revenue: number | string | null;
            }>(
                `SELECT
                    COALESCE(SUM(quantity),0) AS units,
                    COALESCE(SUM(quantity*unitPrice - COALESCE(discount,0)),0) AS revenue
                 FROM product_sales
                 WHERE soldAt BETWEEN $1 AND $2`,
                [from, to],
            );
            const row = res?.[0] ?? { units: 0, revenue: 0 };
            return {
                source: 'product_sales' as const,
                from,
                to,
                units: Number(row.units ?? 0),
                revenue: Number(row.revenue ?? 0),
            };
        }

        if (await this.hasTable('public.inventory_movements')) {
            const res = await this.q<{ units: number | string | null }>(
                `SELECT COALESCE(SUM(CASE WHEN reason='sale' THEN -delta ELSE 0 END),0) AS units
                 FROM inventory_movements
                 WHERE createdAt BETWEEN $1 AND $2`,
                [from, to],
            );
            const row =
                res?.[0] ?? ({ units: 0 } as { units: number | string | null });
            return {
                source: 'inventory_movements' as const,
                from,
                to,
                units: Number(row.units ?? 0),
                revenue: null as number | null,
            };
        }

        return {
            source: 'none' as const,
            from,
            to,
            units: 0,
            revenue: null as number | null,
        };
    }

    private async createCommissionForSaleItem(
        manager: EntityManager,
        dto: CreateSaleDto,
        product: Product,
        unitPriceCents: number,
        quantity: number,
        discountCents: number,
        actor: User,
        productSaleId: number | null,
    ) {
        if (!dto.employeeId) return;

        const employee = await this.users.findOne({
            where: { id: dto.employeeId },
        });
        if (!employee) return;

        const rawPercent = this.config.get<string | number>(
            'PRODUCT_COMMISSION_PERCENT',
        );
        const percentFromEnv =
            rawPercent !== undefined && rawPercent !== null
                ? Number(rawPercent)
                : NaN;
        const percent = !Number.isNaN(percentFromEnv)
            ? percentFromEnv
            : Number(employee.commissionBase ?? 0);

        const amountCents = this.calculateCommissionCents(
            unitPriceCents,
            quantity,
            discountCents,
            percent,
        );
        const amount = amountCents / 100;

        await this.commissions.create(
            {
                employee,
                appointment: dto.appointmentId
                    ? await this.appointments.findOne({
                          where: { id: dto.appointmentId },
                      })
                    : null,
                product,
                productSaleId,
                amount,
                percent,
            },
            actor,
            manager,
        );
    }
}
