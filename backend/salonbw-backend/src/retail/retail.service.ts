import {
    BadRequestException,
    Injectable,
    NotImplementedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Product } from '../products/product.entity';
import { User } from '../users/user.entity';
import { Appointment } from '../appointments/appointment.entity';
import { CreateSaleDto } from './dto/create-sale.dto';
import { AdjustInventoryDto } from './dto/adjust-inventory.dto';
import { CommissionsService } from '../commissions/commissions.service';
import { LogService } from '../logs/log.service';
import { LogAction } from '../logs/log-action.enum';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RetailService {
    // transient context used to avoid anonymous transaction callbacks
    private _txSaleContext?: {
        dto: CreateSaleDto;
        product: Product;
        unitPriceCents: number;
        discountCents: number;
        actor: User;
        createCommission: (m: import('typeorm').EntityManager) => Promise<void>;
    };
    private _txAdjustContext?: {
        dto: AdjustInventoryDto;
        product: Product;
        actor: User;
    };
    constructor(
        @InjectRepository(Product)
        private readonly products: Repository<Product>,
        @InjectRepository(User)
        private readonly users: Repository<User>,
        @InjectRepository(Appointment)
        private readonly appointments: Repository<Appointment>,
        private readonly commissions: CommissionsService,
        private readonly logs: LogService,
        private readonly config: ConfigService,
        private readonly dataSource: DataSource,
    ) {}

    private async q<T>(sql: string, params: unknown[]): Promise<T[]> {
        // Central raw query helper
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const rows = await this.dataSource.query(sql, params);
        return rows as T[];
    }

    /**
     * Calculate commission amount in cents.
     * priceCents: unit price in cents
     * quantity: number of units
     * discountCents: total discount in cents for the sale
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
        // floor to avoid rounding up commission
        return Math.floor((taxableCents * percent) / 100);
    }

    async insertProductSale(
        manager: import('typeorm').EntityManager,
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
        manager: import('typeorm').EntityManager,
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
            [productId, delta, reason, referenceType, referenceId, note, actorId],
        );
    }

    private isEnabled(): boolean {
        return this.config.get<string>('POS_ENABLED', 'false') === 'true';
    }

    private async hasTable(name: string): Promise<boolean> {
        try {
            const result = await this.q<{ exists: string | null }>(
                'SELECT to_regclass($1) AS exists',
                [name],
            );
            const value = result?.[0]?.exists;
            return Boolean(value);
        } catch {
            return false;
        }
    }

    async createSale(dto: CreateSaleDto, actor: User) {
        if (!this.isEnabled()) {
            throw new NotImplementedException('POS is disabled');
        }
        if (dto.quantity <= 0) {
            throw new BadRequestException('quantity must be >= 1');
        }
        const product = await this.products.findOne({
            where: { id: dto.productId },
        });
        if (!product) {
            throw new BadRequestException('Invalid productId');
        }
        // Support cents-based fields for exact currency math. Backwards compatible with float fields.
        const unitPriceCentsFromDto =
            'unitPriceCents' in dto && typeof dto.unitPriceCents === 'number'
                ? Number(dto.unitPriceCents)
                : undefined;
        const discountCentsFromDto =
            'discountCents' in dto && typeof dto.discountCents === 'number'
                ? Number(dto.discountCents)
                : undefined;

        const unitPriceCents =
            unitPriceCentsFromDto !== undefined
                ? unitPriceCentsFromDto
                : Math.round(
                      (dto.unitPrice != null
                          ? Number(dto.unitPrice)
                          : Number(product.unitPrice)) * 100,
                  );
        const discountCents =
            discountCentsFromDto !== undefined
                ? discountCentsFromDto
                : Math.round((dto.discount != null ? Number(dto.discount) : 0) * 100);
        if (unitPriceCents < 0 || discountCents < 0) {
            throw new BadRequestException('unitPrice/discount must be >= 0');
        }
        if (product.stock < dto.quantity) {
            throw new BadRequestException('Insufficient stock');
        }

        // commission creation extracted to helper to reduce transaction complexity
        const createCommission = (manager: import('typeorm').EntityManager) =>
            this.createCommissionForSale(manager, dto, product, unitPriceCents, discountCents, actor);

        // store context and call named method to avoid anonymous function complexity
        this._txSaleContext = {
            dto,
            product,
            unitPriceCents,
            discountCents,
            actor,
            createCommission,
        };

        return this.dataSource.transaction(this.runSaleTransaction.bind(this));
    }

    private async runSaleTransaction(manager: import('typeorm').EntityManager) {
        const ctx = this._txSaleContext;
        if (!ctx) {
            throw new Error('missing transaction context');
        }
        try {
            return await this.updateStockAndSalesAndMovements(
                manager,
                ctx.dto,
                ctx.product,
                ctx.unitPriceCents,
                ctx.discountCents,
                ctx.actor,
                ctx.createCommission,
            );
        } finally {
            // clear transient context
            this._txSaleContext = undefined;
        }
    }

    private async updateStockAndSalesAndMovements(
        manager: import('typeorm').EntityManager,
        dto: CreateSaleDto,
        product: Product,
        unitPriceCents: number,
        discountCents: number,
        actor: User,
        createCommissionFn: (m: import('typeorm').EntityManager) => Promise<void>,
    ) {
        // Adjust stock
        await manager.update(Product, product.id, {
            stock: product.stock - dto.quantity,
        });

        // Optional write to product_sales if table exists
        if (await this.hasTable('public.product_sales')) {
            await this.insertProductSale(
                manager,
                product.id,
                dto.quantity,
                unitPriceCents,
                discountCents,
                dto.employeeId ?? null,
                dto.appointmentId ?? null,
                dto.note ?? null,
            );
        }

        // Optional inventory movement
        if (await this.hasTable('public.inventory_movements')) {
            await this.insertInventoryMovement(
                manager,
                product.id,
                -dto.quantity,
                'sale',
                dto.appointmentId ? 'appointment' : null,
                dto.appointmentId ?? null,
                dto.note ?? null,
                actor.id ?? null,
            );
        }

        // Commission (best-effort)
        try {
            await createCommissionFn(manager);
        } catch {
            /* non-fatal commission error */
            void 0;
        }

        try {
            await this.logs.logAction(actor, LogAction.PRODUCT_UPDATED, {
                entity: 'product',
                productId: product.id,
                change: 'sale',
                quantity: dto.quantity,
            });
        } catch {
            /* non-fatal log error */
            void 0;
        }

        return { status: 'ok' } as const;
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
        this._txAdjustContext = { dto, product, actor };
        return this.dataSource.transaction(this.runAdjustTransaction.bind(this));
    }

    private async runAdjustTransaction(manager: import('typeorm').EntityManager) {
        const ctx = this._txAdjustContext;
        if (!ctx) throw new Error('missing adjust transaction context');
        try {
            await manager.update(Product, ctx.product.id, {
                stock: ctx.product.stock + ctx.dto.delta,
            });

            if (await this.hasTable('public.inventory_movements')) {
                await manager.query(
                    `INSERT INTO inventory_movements (productId, delta, reason, referenceType, referenceId, note, createdAt, actorId)
                     VALUES ($1, $2, $3, $4, $5, $6, now(), $7)`,
                    [
                        ctx.product.id,
                        ctx.dto.delta,
                        ctx.dto.reason,
                        null,
                        null,
                        ctx.dto.note ?? null,
                        ctx.actor.id ?? null,
                    ],
                );
            }

            try {
                await this.logs.logAction(ctx.actor, LogAction.PRODUCT_UPDATED, {
                    entity: 'product',
                    productId: ctx.product.id,
                    change: 'adjust',
                    delta: ctx.dto.delta,
                    reason: ctx.dto.reason,
                });
            } catch {
                void 0;
            }

            return { status: 'ok' } as const;
        } finally {
            this._txAdjustContext = undefined;
        }
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

        // Neither table exists yet – only schema groundwork present
        return {
            source: 'none' as const,
            from,
            to,
            units: 0,
            revenue: null as number | null,
        };
    }

    private async createCommissionForSale(
        manager: import('typeorm').EntityManager,
        dto: CreateSaleDto,
        product: Product,
        unitPriceCents: number,
        discountCents: number,
        actor: User,
    ) {
        if (!dto.employeeId) return;
        const employee = await this.users.findOne({ where: { id: dto.employeeId } });
        if (!employee) return;
        const rawPercent = this.config.get<string | number>('PRODUCT_COMMISSION_PERCENT');
        const percentFromEnv = rawPercent !== undefined && rawPercent !== null ? Number(rawPercent) : NaN;
        const percent = !Number.isNaN(percentFromEnv) ? percentFromEnv : Number(employee.commissionBase ?? 0);

        const amountCents = this.calculateCommissionCents(
            unitPriceCents,
            dto.quantity,
            discountCents,
            percent,
        );
        const amount = amountCents / 100;

        await this.commissions.create(
            {
                employee,
                appointment: dto.appointmentId
                    ? await this.appointments.findOne({ where: { id: dto.appointmentId } })
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
