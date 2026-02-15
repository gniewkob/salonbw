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
import { AdjustInventoryDto } from './dto/adjust-inventory.dto';
import { CreateUsageDto } from './dto/create-usage.dto';
import { CommissionsService } from '../commissions/commissions.service';
import { LogService } from '../logs/log.service';
import { LogAction } from '../logs/log-action.enum';
import { WarehouseSale } from '../warehouse/entities/warehouse-sale.entity';
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

    private async generateSaleNumber(manager: EntityManager): Promise<string> {
        const now = new Date();
        const prefix = `S${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
        const rows = await manager.query(
            'SELECT id FROM warehouse_sales ORDER BY id DESC LIMIT 1',
        );
        const next = Number(rows?.[0]?.id ?? 0) + 1;
        return `${prefix}${String(next).padStart(5, '0')}`;
    }

    private async generateUsageNumber(manager: EntityManager): Promise<string> {
        const now = new Date();
        const prefix = `U${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
        const rows = await manager.query(
            'SELECT id FROM warehouse_usages ORDER BY id DESC LIMIT 1',
        );
        const next = Number(rows?.[0]?.id ?? 0) + 1;
        return `${prefix}${String(next).padStart(5, '0')}`;
    }

    async insertProductSale(
        manager: EntityManager,
        productId: number,
        quantity: number,
        unitPriceCents: number,
        discountCents: number,
        employeeId: number | null,
        appointmentId: number | null,
        note: string | null,
    ) {
        const unitPriceDecimal = (unitPriceCents / 100).toFixed(2);
        const discountDecimal = (discountCents / 100).toFixed(2);
        await manager.query(
            `INSERT INTO product_sales (productId, soldAt, quantity, unitPrice, discount, employeeId, appointmentId, note)
             VALUES ($1, now(), $2, $3, $4, $5, $6, $7)`,
            [
                productId,
                quantity,
                unitPriceDecimal,
                discountDecimal,
                employeeId,
                appointmentId,
                note,
            ],
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
        for (const item of items) {
            if (item.product.stock < item.quantity) {
                throw new BadRequestException(
                    `Insufficient stock for product ${item.product.id}`,
                );
            }
        }

        const writeProductSales = await this.hasTable('public.product_sales');
        const writeInventoryMovements = await this.hasTable(
            'public.inventory_movements',
        );

        const sale = await this.dataSource.transaction(async (manager) => {
            const created = manager.create(WarehouseSale, {
                saleNumber: await this.generateSaleNumber(manager),
                soldAt: dto.soldAt ? new Date(dto.soldAt) : new Date(),
                clientName: dto.clientName ?? null,
                clientId: null,
                employeeId: dto.employeeId ?? null,
                appointmentId: dto.appointmentId ?? null,
                discountGross: 0,
                totalNet: 0,
                totalGross: 0,
                paymentMethod: dto.paymentMethod ?? null,
                notes: dto.note ?? null,
                createdById: actor.id ?? null,
            });
            await manager.save(created);

            let totalDiscount = 0;
            let totalNet = 0;
            let totalGross = 0;

            for (const item of items) {
                const product = await manager.findOne(Product, {
                    where: { id: item.product.id },
                });
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
                await manager.save(product);

                const saleItem = manager.create(WarehouseSaleItem, {
                    saleId: created.id,
                    productId: product.id,
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

                if (writeProductSales) {
                    await this.insertProductSale(
                        manager,
                        product.id,
                        item.quantity,
                        Math.round(item.unitPriceGross * 100),
                        Math.round(discountGross * 100),
                        dto.employeeId ?? null,
                        dto.appointmentId ?? null,
                        dto.note ?? null,
                    );
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

                try {
                    await this.createCommissionForSaleItem(
                        manager,
                        dto,
                        product,
                        Math.round(item.unitPriceGross * 100),
                        item.quantity,
                        Math.round(discountGross * 100),
                        actor,
                    );
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

                totalDiscount += discountGross;
                totalNet += lineNet;
                totalGross += lineGross;

                this.logger.debug(
                    `Recorded sale item product=${product.id} quantity=${item.quantity} stockBefore=${stockBefore} stockAfter=${product.stock}`,
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

    async listSales() {
        if (!(await this.hasTable('public.warehouse_sales'))) {
            return [];
        }

        return this.warehouseSales.find({
            relations: ['items', 'items.product', 'employee', 'createdBy'],
            order: { soldAt: 'DESC', id: 'DESC' },
        });
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
            const product = productsById.get(item.productId);
            if (!product) {
                throw new NotFoundException(
                    `Product ${item.productId} not found`,
                );
            }
            if (item.quantity < 1) {
                throw new BadRequestException('quantity must be >= 1');
            }
            if (!isPlanned && product.stock < item.quantity) {
                throw new BadRequestException(
                    `Insufficient stock for product ${item.productId}`,
                );
            }
        }

        const writeInventoryMovements = await this.hasTable(
            'public.inventory_movements',
        );

        const usage = await this.dataSource.transaction(async (manager) => {
            const created = manager.create(WarehouseUsage, {
                usageNumber: await this.generateUsageNumber(manager),
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

            for (const item of dto.items) {
                const product = await manager.findOne(Product, {
                    where: { id: item.productId },
                });
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
                    await manager.save(product);
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
            .leftJoinAndSelect('items.product', 'product')
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
                amount,
                percent,
            },
            actor,
            manager,
        );
    }
}
