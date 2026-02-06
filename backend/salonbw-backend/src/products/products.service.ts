import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Product, ProductType } from './product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { LogService } from '../logs/log.service';
import { LogAction } from '../logs/log-action.enum';
import { User } from '../users/user.entity';
import { AppCacheService } from '../cache/cache.service';
import { QueryProductsDto } from './dto/query-products.dto';
import { ProductCategory } from './entities/product-category.entity';
import { ProductCommissionRule } from './entities/product-commission-rule.entity';
import { ServiceRecipeItem } from '../services/entities/service-recipe-item.entity';
import { Role } from '../users/role.enum';

const ALL_PRODUCTS_CACHE_KEY = 'products:all';
const productCacheKey = (id: number) => `products:${id}`;

export interface ProductCardResponse {
    product: Product;
    pricing: {
        saleGross: number;
        saleNet: number;
        purchaseNet: number;
        purchaseGross: number;
        vatRate: number;
    };
    stock: {
        quantity: number;
        unit: string;
        minQuantity: number | null;
        stockValueNet: number;
        stockValueGross: number;
    };
    metadata: {
        category: string | null;
        manufacturer: string | null;
        packageSize: number | null;
        packageUnit: string | null;
        sku: string | null;
        barcode: string | null;
        createdAt: Date;
        updatedAt: Date;
    };
}

export interface ProductHistoryItem {
    id: string;
    source: 'sale' | 'usage' | 'delivery' | 'stocktaking' | 'adjustment';
    label: string;
    createdAt: string;
    quantity: number;
    quantityBefore: number | null;
    quantityAfter: number | null;
    unitPriceNet: number | null;
    unitPriceGross: number | null;
    totalNet: number | null;
    totalGross: number | null;
    vatRate: number | null;
    clientName: string | null;
    reference: {
        type: 'sale' | 'usage' | 'delivery' | 'stocktaking' | 'inventory';
        id: number;
        label: string;
        href: string;
    } | null;
    notes: string | null;
}

@Injectable()
export class ProductsService {
    constructor(
        @InjectRepository(Product)
        private readonly productsRepository: Repository<Product>,
        @InjectRepository(ProductCategory)
        private readonly categoriesRepository: Repository<ProductCategory>,
        @InjectRepository(ProductCommissionRule)
        private readonly productCommissionRulesRepository: Repository<ProductCommissionRule>,
        @InjectRepository(ServiceRecipeItem)
        private readonly serviceRecipeItemsRepository: Repository<ServiceRecipeItem>,
        @InjectRepository(User)
        private readonly usersRepository: Repository<User>,
        private readonly logService: LogService,
        private readonly cache: AppCacheService,
        private readonly dataSource: DataSource,
    ) {}

    async create(dto: CreateProductDto, user: User): Promise<Product> {
        const product = this.productsRepository.create({
            ...dto,
            vatRate: dto.vatRate ?? 23,
            productType: dto.productType ?? ProductType.Product,
            isActive: dto.isActive ?? true,
            trackStock: dto.trackStock ?? true,
        });
        const saved = await this.productsRepository.save(product);
        try {
            await this.logService.logAction(user, LogAction.PRODUCT_CREATED, {
                productId: saved.id,
                name: saved.name,
            });
        } catch (error) {
            console.error('Failed to log product creation action', error);
        }
        await this.invalidateCache(saved.id);
        return this.findOne(saved.id);
    }

    async findAll(options?: QueryProductsDto): Promise<Product[]> {
        if (!options || Object.keys(options).length === 0) {
            return this.cache.wrap<Product[]>(ALL_PRODUCTS_CACHE_KEY, () =>
                this.productsRepository.find({
                    relations: ['category', 'defaultSupplier'],
                    order: { name: 'ASC' },
                }),
            );
        }

        const qb = this.productsRepository
            .createQueryBuilder('product')
            .leftJoinAndSelect('product.category', 'category')
            .leftJoinAndSelect('product.defaultSupplier', 'defaultSupplier');

        if (options.includeInactive !== true) {
            qb.andWhere('product.isActive = true');
        }

        if (options.search) {
            qb.andWhere(
                '(product.name ILIKE :q OR product.sku ILIKE :q OR product.barcode ILIKE :q OR product.brand ILIKE :q)',
                {
                    q: `%${options.search}%`,
                },
            );
        }

        if (options.categoryId) {
            qb.andWhere('product.categoryId = :categoryId', {
                categoryId: options.categoryId,
            });
        }

        if (options.productType) {
            qb.andWhere('product.productType = :productType', {
                productType: options.productType,
            });
        }

        const allowedSortBy = new Set([
            'name',
            'stock',
            'unitPrice',
            'createdAt',
            'updatedAt',
        ]);
        const sortBy =
            options.sortBy && allowedSortBy.has(options.sortBy)
                ? options.sortBy
                : 'name';
        const sortOrder = options.sortOrder === 'DESC' ? 'DESC' : 'ASC';
        qb.orderBy(`product.${sortBy}`, sortOrder);

        return qb.getMany();
    }

    async findOne(id: number): Promise<Product> {
        const cached = await this.cache.get<Product>(productCacheKey(id));
        if (cached) {
            return cached;
        }

        const product = await this.productsRepository.findOne({
            where: { id },
            relations: ['category', 'defaultSupplier'],
        });
        if (!product) {
            throw new NotFoundException('Product not found');
        }

        await this.cache.set(productCacheKey(id), product);
        return product;
    }

    async getCard(id: number): Promise<ProductCardResponse> {
        const product = await this.findOne(id);
        const vatRate = Number(product.vatRate ?? 23);
        const saleGross = Number(product.unitPrice ?? 0);
        const saleNet = saleGross / (1 + vatRate / 100);
        const purchaseNet = Number(product.purchasePrice ?? 0);
        const purchaseGross = purchaseNet * (1 + vatRate / 100);
        const stockQty = Number(product.stock ?? 0);

        return {
            product,
            pricing: {
                saleGross,
                saleNet,
                purchaseNet,
                purchaseGross,
                vatRate,
            },
            stock: {
                quantity: stockQty,
                unit: product.unit ?? 'op.',
                minQuantity: product.minQuantity,
                stockValueNet: stockQty * saleNet,
                stockValueGross: stockQty * saleGross,
            },
            metadata: {
                category: product.category?.name ?? null,
                manufacturer: product.manufacturer,
                packageSize: product.packageSize,
                packageUnit: product.packageUnit,
                sku: product.sku,
                barcode: product.barcode,
                createdAt: product.createdAt,
                updatedAt: product.updatedAt,
            },
        };
    }

    async getHistory(id: number): Promise<ProductHistoryItem[]> {
        await this.findOne(id);

        const history: ProductHistoryItem[] = [];

        if (await this.hasTable('public.warehouse_sale_items')) {
            const saleRows = await this.dataSource.query(
                `
                SELECT
                    wsi.id,
                    wsi."saleId",
                    wsi.quantity,
                    wsi."unitPriceNet",
                    wsi."unitPriceGross",
                    wsi."totalNet",
                    wsi."totalGross",
                    wsi."vatRate",
                    ws."clientName",
                    ws."soldAt",
                    ws."saleNumber",
                    ws.notes
                FROM warehouse_sale_items wsi
                INNER JOIN warehouse_sales ws ON ws.id = wsi."saleId"
                WHERE wsi."productId" = $1
                ORDER BY ws."soldAt" DESC
                `,
                [id],
            );

            for (const row of saleRows as Array<Record<string, unknown>>) {
                history.push({
                    id: `sale-${row.saleId as number}-${row.id as number}`,
                    source: 'sale',
                    label: 'sprzedaż',
                    createdAt: new Date(row.soldAt as string).toISOString(),
                    quantity: -Number(row.quantity ?? 0),
                    quantityBefore: null,
                    quantityAfter: null,
                    unitPriceNet: Number(row.unitPriceNet ?? 0),
                    unitPriceGross: Number(row.unitPriceGross ?? 0),
                    totalNet: Number(row.totalNet ?? 0),
                    totalGross: Number(row.totalGross ?? 0),
                    vatRate: Number(row.vatRate ?? 23),
                    clientName: (row.clientName as string | null) ?? null,
                    reference: {
                        type: 'sale',
                        id: Number(row.saleId),
                        label:
                            (row.saleNumber as string | null) ??
                            `Sprzedaż #${row.saleId as number}`,
                        href: `/sales/history/${row.saleId as number}`,
                    },
                    notes: (row.notes as string | null) ?? null,
                });
            }
        }

        if (await this.hasTable('public.warehouse_usage_items')) {
            const usageRows = await this.dataSource.query(
                `
                SELECT
                    wui.id,
                    wui."usageId",
                    wui.quantity,
                    wui."stockBefore",
                    wui."stockAfter",
                    wu."usedAt",
                    wu."usageNumber",
                    wu.notes,
                    wu."clientName"
                FROM warehouse_usage_items wui
                INNER JOIN warehouse_usages wu ON wu.id = wui."usageId"
                WHERE wui."productId" = $1
                ORDER BY wu."usedAt" DESC
                `,
                [id],
            );

            for (const row of usageRows as Array<Record<string, unknown>>) {
                history.push({
                    id: `usage-${row.usageId as number}-${row.id as number}`,
                    source: 'usage',
                    label: 'zużycie',
                    createdAt: new Date(row.usedAt as string).toISOString(),
                    quantity: -Number(row.quantity ?? 0),
                    quantityBefore: Number(row.stockBefore ?? 0),
                    quantityAfter: Number(row.stockAfter ?? 0),
                    unitPriceNet: null,
                    unitPriceGross: null,
                    totalNet: null,
                    totalGross: null,
                    vatRate: null,
                    clientName: (row.clientName as string | null) ?? null,
                    reference: {
                        type: 'usage',
                        id: Number(row.usageId),
                        label:
                            (row.usageNumber as string | null) ??
                            `Zużycie #${row.usageId as number}`,
                        href: `/use/history/${row.usageId as number}`,
                    },
                    notes: (row.notes as string | null) ?? null,
                });
            }
        }

        if (await this.hasTable('public.product_movements')) {
            const movementRows = await this.dataSource.query(
                `
                SELECT
                    pm.id,
                    pm."movementType",
                    pm.quantity,
                    pm."quantityBefore",
                    pm."quantityAfter",
                    pm.notes,
                    pm."deliveryId",
                    pm."stocktakingId",
                    pm."createdAt",
                    d."deliveryNumber",
                    st."stocktakingNumber"
                FROM product_movements pm
                LEFT JOIN deliveries d ON d.id = pm."deliveryId"
                LEFT JOIN stocktakings st ON st.id = pm."stocktakingId"
                WHERE pm."productId" = $1
                ORDER BY pm."createdAt" DESC
                `,
                [id],
            );

            for (const row of movementRows as Array<Record<string, unknown>>) {
                const movementType = String(row.movementType ?? 'adjustment');
                const isDelivery = movementType === 'delivery';
                const isStocktaking = movementType === 'stocktaking';
                const source: ProductHistoryItem['source'] = isDelivery
                    ? 'delivery'
                    : isStocktaking
                      ? 'stocktaking'
                      : 'adjustment';

                const reference = isDelivery
                    ? {
                          type: 'delivery' as const,
                          id: Number(row.deliveryId),
                          label:
                              (row.deliveryNumber as string | null) ??
                              `Dostawa #${row.deliveryId as number}`,
                          href: '/deliveries/history',
                      }
                    : isStocktaking
                      ? {
                            type: 'stocktaking' as const,
                            id: Number(row.stocktakingId),
                            label:
                                (row.stocktakingNumber as string | null) ??
                                `Inwentaryzacja #${row.stocktakingId as number}`,
                            href: `/inventory/${row.stocktakingId as number}`,
                        }
                      : null;

                history.push({
                    id: `movement-${row.id as number}`,
                    source,
                    label: movementType,
                    createdAt: new Date(row.createdAt as string).toISOString(),
                    quantity: Number(row.quantity ?? 0),
                    quantityBefore: Number(row.quantityBefore ?? 0),
                    quantityAfter: Number(row.quantityAfter ?? 0),
                    unitPriceNet: null,
                    unitPriceGross: null,
                    totalNet: null,
                    totalGross: null,
                    vatRate: null,
                    clientName: null,
                    reference,
                    notes: (row.notes as string | null) ?? null,
                });
            }
        }

        history.sort((a, b) =>
            a.createdAt > b.createdAt ? -1 : a.createdAt < b.createdAt ? 1 : 0,
        );

        return history;
    }

    async getFormulas(id: number) {
        await this.findOne(id);

        const rows = await this.serviceRecipeItemsRepository.find({
            where: { productId: id },
            relations: ['service', 'serviceVariant'],
            order: { createdAt: 'DESC' },
        });

        return rows.map((item) => ({
            id: item.id,
            serviceId: item.serviceId,
            serviceName: item.service?.name ?? null,
            serviceVariantId: item.serviceVariantId ?? null,
            serviceVariantName: item.serviceVariant?.name ?? null,
            quantity: Number(item.quantity ?? 0),
            unit: item.unit ?? null,
            notes: item.notes ?? null,
            createdAt: item.createdAt,
        }));
    }

    async getCommissions(id: number) {
        await this.findOne(id);

        const [rules, employees] = await Promise.all([
            this.productCommissionRulesRepository.find({
                where: { productId: id },
                order: { id: 'ASC' },
            }),
            this.usersRepository.find({
                where: [{ role: Role.Employee }, { role: Role.Receptionist }],
                order: { name: 'ASC' },
            }),
        ]);

        const byEmployee = new Map(
            rules.map((rule) => [rule.employeeId, rule] as const),
        );

        return employees.map((employee) => {
            const rule = byEmployee.get(employee.id);
            return {
                id: rule?.id ?? null,
                employeeId: employee.id,
                employeeName: employee.name,
                commissionPercent: Number(rule?.commissionPercent ?? 0),
            };
        });
    }

    async updateCommissions(
        id: number,
        rules: Array<{ employeeId: number; commissionPercent: number }>,
        actor: User,
    ) {
        await this.findOne(id);

        const employeeIds = Array.from(
            new Set(rules.map((rule) => rule.employeeId)),
        );
        if (employeeIds.length > 0) {
            const employees = await this.usersRepository.find({
                where: {
                    id: In(employeeIds),
                },
            });
            const existingIds = new Set(
                employees.map((employee) => employee.id),
            );
            const invalidId = employeeIds.find(
                (employeeId) => !existingIds.has(employeeId),
            );
            if (invalidId) {
                throw new NotFoundException(`Employee ${invalidId} not found`);
            }
        }

        await this.productCommissionRulesRepository.delete({ productId: id });

        const toPersist = rules
            .filter((rule) => Number(rule.commissionPercent) >= 0)
            .map((rule) =>
                this.productCommissionRulesRepository.create({
                    productId: id,
                    employeeId: rule.employeeId,
                    commissionPercent: Number(rule.commissionPercent),
                }),
            );

        if (toPersist.length > 0) {
            await this.productCommissionRulesRepository.save(toPersist);
        }

        try {
            await this.logService.logAction(actor, LogAction.PRODUCT_UPDATED, {
                productId: id,
                action: 'update_commissions',
                rulesCount: toPersist.length,
            });
        } catch (error) {
            console.error('Failed to log commission update', error);
        }

        return this.getCommissions(id);
    }

    async update(
        id: number,
        dto: UpdateProductDto,
        user: User,
    ): Promise<Product> {
        await this.productsRepository.update(id, dto);
        const updated = await this.findOne(id);
        try {
            await this.logService.logAction(user, LogAction.PRODUCT_UPDATED, {
                productId: updated.id,
                name: updated.name,
            });
        } catch (error) {
            console.error('Failed to log product update action', error);
        }
        await this.invalidateCache(id);
        return updated;
    }

    async remove(id: number, user: User): Promise<void> {
        const product = await this.findOne(id);
        await this.productsRepository.delete(id);
        try {
            await this.logService.logAction(user, LogAction.PRODUCT_DELETED, {
                productId: product.id,
                name: product.name,
            });
        } catch (error) {
            console.error('Failed to log product deletion action', error);
        }
        await this.invalidateCache(id);
    }

    private async hasTable(tableName: string): Promise<boolean> {
        const rows = await this.dataSource.query(
            'SELECT to_regclass($1) as "exists"',
            [tableName],
        );

        return Boolean(rows?.[0]?.exists);
    }

    private async invalidateCache(id: number): Promise<void> {
        await Promise.all([
            this.cache.del(ALL_PRODUCTS_CACHE_KEY),
            this.cache.del(productCacheKey(id)),
        ]);
    }
}
