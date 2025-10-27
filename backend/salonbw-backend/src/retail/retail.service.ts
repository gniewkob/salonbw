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
        const unitPrice =
            dto.unitPrice != null
                ? Number(dto.unitPrice)
                : Number(product.unitPrice);
        const discount = dto.discount != null ? Number(dto.discount) : 0;
        if (unitPrice < 0 || discount < 0) {
            throw new BadRequestException('unitPrice/discount must be >= 0');
        }
        if (product.stock < dto.quantity) {
            throw new BadRequestException('Insufficient stock');
        }

        const createCommission = async (
            manager: import('typeorm').EntityManager,
        ) => {
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
            const priceCents = Math.round(unitPrice * 100) * dto.quantity;
            const discountCents = Math.round(discount * 100);
            const amountCents = Math.max(
                0,
                Math.round(((priceCents - discountCents) * percent) / 100),
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
        };

        return this.dataSource.transaction(async (manager) => {
            // Adjust stock
            await manager.update(Product, product.id, {
                stock: product.stock - dto.quantity,
            });

            // Optional write to product_sales if table exists
            if (await this.hasTable('public.product_sales')) {
                await manager.query(
                    `INSERT INTO product_sales (productId, soldAt, quantity, unitPrice, discount, employeeId, appointmentId, note)
                     VALUES ($1, now(), $2, $3, $4, $5, $6, $7)`,
                    [
                        product.id,
                        dto.quantity,
                        unitPrice,
                        discount,
                        dto.employeeId ?? null,
                        dto.appointmentId ?? null,
                        dto.note ?? null,
                    ],
                );
            }

            // Optional inventory movement
            if (await this.hasTable('public.inventory_movements')) {
                await manager.query(
                    `INSERT INTO inventory_movements (productId, delta, reason, referenceType, referenceId, note, createdAt, actorId)
                     VALUES ($1, $2, $3, $4, $5, $6, now(), $7)`,
                    [
                        product.id,
                        -dto.quantity,
                        'sale',
                        dto.appointmentId ? 'appointment' : null,
                        dto.appointmentId ?? null,
                        dto.note ?? null,
                        actor.id ?? null,
                    ],
                );
            }

            // Commission (best-effort)
            try {
                await createCommission(manager);
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
        });
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
        return this.dataSource.transaction(async (manager) => {
            await manager.update(Product, product.id, {
                stock: product.stock + dto.delta,
            });
            if (await this.hasTable('public.inventory_movements')) {
                await manager.query(
                    `INSERT INTO inventory_movements (productId, delta, reason, referenceType, referenceId, note, createdAt, actorId)
                     VALUES ($1, $2, $3, $4, $5, $6, now(), $7)`,
                    [
                        product.id,
                        dto.delta,
                        dto.reason,
                        null,
                        null,
                        dto.note ?? null,
                        actor.id ?? null,
                    ],
                );
            }
            try {
                await this.logs.logAction(actor, LogAction.PRODUCT_UPDATED, {
                    entity: 'product',
                    productId: product.id,
                    change: 'adjust',
                    delta: dto.delta,
                    reason: dto.reason,
                });
            } catch {
                /* non-fatal log error */
                void 0;
            }
            return { status: 'ok' } as const;
        });
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
}
