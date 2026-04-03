import { RetailService } from './retail.service';
import { Repository, DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Product } from '../products/product.entity';
import { Appointment } from '../appointments/appointment.entity';
import { User } from '../users/user.entity';
import { CommissionsService } from '../commissions/commissions.service';
import { LogService } from '../logs/log.service';
import {
    WarehouseSaleKind,
    WarehouseSaleStatus,
} from '../warehouse/entities/warehouse-sale.entity';
import { BadRequestException } from '@nestjs/common';

describe('RetailService.calculateCommissionCents', () => {
    // create a minimal instance (dependencies not used by the tested method)
    const svc = new RetailService(
        null as unknown as Repository<Product>,
        null as unknown as Repository<User>,
        null as unknown as Repository<Appointment>,
        null as unknown as Repository<
            import('../warehouse/entities/warehouse-sale.entity').WarehouseSale
        >,
        null as unknown as Repository<
            import('../warehouse/entities/warehouse-sale-item.entity').WarehouseSaleItem
        >,
        null as unknown as Repository<
            import('../warehouse/entities/warehouse-usage.entity').WarehouseUsage
        >,
        null as unknown as Repository<
            import('../warehouse/entities/warehouse-usage-item.entity').WarehouseUsageItem
        >,
        null as unknown as CommissionsService,
        null as unknown as LogService,
        { get: () => 'false' } as unknown as ConfigService,
        null as unknown as DataSource,
    );

    test('calculates basic 10% commission and floors cents', () => {
        const cents = svc.calculateCommissionCents(1999, 1, 0, 10);
        // 1999 * 10% = 199.9 cents -> floor to 199
        expect(cents).toBe(199);
    });

    test('small amounts round down to zero', () => {
        const cents = svc.calculateCommissionCents(1, 1, 0, 1);
        // 1 * 1% = 0.01 -> floor to 0
        expect(cents).toBe(0);
    });

    test('applies discount before commission', () => {
        // price 100 cents * 2 = 200, discount 150 => taxable 50, 10% => 5 cents
        const cents = svc.calculateCommissionCents(100, 2, 150, 10);
        expect(cents).toBe(5);
    });

    test('aggregates duplicate sale lines before stock validation', () => {
        const aggregated = (
            svc as unknown as {
                aggregateSaleQuantities: (
                    items: Array<{
                        product: { id: number };
                        quantity: number;
                    }>,
                ) => Array<{ productId: number; quantity: number }>;
            }
        ).aggregateSaleQuantities([
            { product: { id: 1 }, quantity: 3 },
            { product: { id: 1 }, quantity: 2 },
            { product: { id: 2 }, quantity: 1 },
        ]);

        expect(aggregated).toEqual([
            { productId: 1, quantity: 5 },
            { productId: 2, quantity: 1 },
        ]);
    });

    test('aggregates duplicate usage lines before stock validation', () => {
        const aggregated = (
            svc as unknown as {
                aggregateUsageQuantities: (
                    items: Array<{
                        productId: number;
                        quantity: number;
                    }>,
                ) => Array<{ productId: number; quantity: number }>;
            }
        ).aggregateUsageQuantities([
            { productId: 7, quantity: 1 },
            { productId: 7, quantity: 4 },
            { productId: 8, quantity: 2 },
        ]);

        expect(aggregated).toEqual([
            { productId: 7, quantity: 5 },
            { productId: 8, quantity: 2 },
        ]);
    });
});

describe('RetailService reversal flow', () => {
    const createService = () => {
        const products = {
            find: jest.fn(),
            findOne: jest.fn(),
        } as unknown as Repository<Product>;
        const users = {
            findOne: jest.fn(),
        } as unknown as Repository<User>;
        const appointments = {
            findOne: jest.fn(),
        } as unknown as Repository<Appointment>;
        const warehouseSales = {
            findOne: jest.fn(),
            find: jest.fn(),
            count: jest.fn(),
        } as unknown as Repository<
            import('../warehouse/entities/warehouse-sale.entity').WarehouseSale
        >;
        const warehouseSaleItems = {} as unknown as Repository<
            import('../warehouse/entities/warehouse-sale-item.entity').WarehouseSaleItem
        >;
        const warehouseUsages = {} as unknown as Repository<
            import('../warehouse/entities/warehouse-usage.entity').WarehouseUsage
        >;
        const warehouseUsageItems = {} as unknown as Repository<
            import('../warehouse/entities/warehouse-usage-item.entity').WarehouseUsageItem
        >;
        const commissions = {
            create: jest.fn(),
        } as unknown as CommissionsService;
        const logs = {
            logAction: jest.fn(),
        } as unknown as LogService;
        const config = {
            get: jest.fn((key: string, defaultValue?: string) => {
                if (key === 'POS_REQUIRE_COMMISSION') return 'false';
                if (key === 'POS_ENABLED') return 'true';
                return defaultValue;
            }),
        } as unknown as ConfigService;
        const dataSource = {
            query: jest.fn(),
            transaction: jest.fn(),
        } as unknown as DataSource;

        return {
            service: new RetailService(
                products,
                users,
                appointments,
                warehouseSales,
                warehouseSaleItems,
                warehouseUsages,
                warehouseUsageItems,
                commissions,
                logs,
                config,
                dataSource,
            ),
            warehouseSales,
            dataSource,
        };
    };

    test('resolveReversalSelection defaults to remaining quantities after previous reversals', async () => {
        const { service, warehouseSales } = createService();

        (
            warehouseSales.find as unknown as jest.Mock
        ).mockResolvedValue([
            {
                items: [{ originalSaleItemId: 10, quantity: -1 }],
            },
        ]);

        const sourceSale = {
            id: 5,
            items: [
                { id: 10, quantity: 3 },
                { id: 11, quantity: 2 },
            ],
        };

        const selections = await (
            service as unknown as {
                resolveReversalSelection: (
                    sourceSale: unknown,
                    dto: unknown,
                ) => Promise<
                    Array<{
                        sourceItem: { id: number };
                        quantity: number;
                        proportion: number;
                    }>
                >;
            }
        ).resolveReversalSelection(sourceSale, {});

        expect(selections).toHaveLength(2);
        expect(selections[0]).toMatchObject({
            sourceItem: { id: 10 },
            quantity: 2,
        });
        expect(selections[0].proportion).toBeCloseTo(2 / 3);
        expect(selections[1]).toMatchObject({
            sourceItem: { id: 11 },
            quantity: 2,
            proportion: 1,
        });
    });

    test('voidSale rejects void when another reversal already exists', async () => {
        const { service, warehouseSales } = createService();
        const sourceSale = {
            id: 12,
            status: WarehouseSaleStatus.Active,
            sourceSaleId: null,
            items: [],
        };

        jest.spyOn(
            service as unknown as {
                getSaleForReversal: (id: number) => Promise<unknown>;
            },
            'getSaleForReversal',
        ).mockResolvedValue(sourceSale);
        (
            warehouseSales.count as unknown as jest.Mock
        ).mockResolvedValue(1);

        await expect(
            service.voidSale(12, {}, { id: 7 } as User),
        ).rejects.toThrow(BadRequestException);
    });

    test('createReversalSale creates refund ledger entry, restocks inventory and updates source status', async () => {
        const { service, dataSource } = createService();
        const actor = { id: 99 } as User;
        const sourceSale = {
            id: 20,
            saleNumber: 'S20260300020',
            soldAt: new Date('2026-03-10T10:00:00Z'),
            clientName: 'Jan',
            clientId: 1,
            employeeId: 2,
            appointmentId: 3,
            paymentMethod: 'cash',
            notes: 'source note',
            sourceSaleId: null,
            employee: null,
            status: WarehouseSaleStatus.Active,
            items: [
                {
                    id: 201,
                    productId: 301,
                    productName: 'Szampon',
                    quantity: 2,
                    unit: 'szt.',
                    unitPriceNet: 8.13,
                    unitPriceGross: 10,
                    vatRate: 23,
                    discountGross: 1,
                    totalNet: 16.26,
                    totalGross: 20,
                },
            ],
        };
        const lockedSourceSale = { ...sourceSale };
        const lockedProduct = { id: 301, stock: 4, name: 'Szampon' };
        let nextId = 500;
        const savedItems: Array<Record<string, unknown>> = [];
        const manager = {
            findOne: jest.fn().mockResolvedValue(lockedSourceSale),
            find: jest.fn().mockResolvedValue([lockedProduct]),
            create: jest.fn(
                (_entity: unknown, payload: Record<string, unknown>) => ({
                    ...payload,
                }),
            ),
            save: jest.fn(async (payload: Record<string, unknown>) => {
                if (Array.isArray(payload)) return payload;
                if (!payload.id) {
                    payload.id = nextId++;
                }
                savedItems.push({ ...payload });
                return payload;
            }),
            query: jest.fn().mockResolvedValue([]),
        };

        (
            dataSource.transaction as unknown as jest.Mock
        ).mockImplementation(async (cb: (manager: unknown) => Promise<unknown>) =>
            cb(manager),
        );

        jest.spyOn(
            service as unknown as { resolveReversalSelection: (...args: unknown[]) => Promise<unknown> },
            'resolveReversalSelection',
        ).mockResolvedValue([
            {
                sourceItem: sourceSale.items[0],
                quantity: 2,
                proportion: 1,
            },
        ]);
        jest.spyOn(
            service as unknown as { hasTable: (name: string) => Promise<boolean> },
            'hasTable',
        ).mockResolvedValue(false);
        jest.spyOn(
            service as unknown as { formatSaleNumber: (id: number) => string },
            'formatSaleNumber',
        ).mockReturnValue('S20260300501');
        jest.spyOn(service, 'getSaleDetails').mockResolvedValue({
            id: 500,
            summary: { totalGross: -20 },
        } as never);

        const result = await (
            service as unknown as {
                createReversalSale: (
                    sourceSaleArg: unknown,
                    dto: unknown,
                    actorArg: User,
                    kind: WarehouseSaleKind,
                ) => Promise<unknown>;
            }
        ).createReversalSale(
            sourceSale,
            {
                reason: 'Refund test',
                soldAt: '2026-03-12T10:00:00.000Z',
                restock: true,
                reverseCommission: false,
            },
            actor,
            WarehouseSaleKind.Refund,
        );

        expect(result).toEqual({
            id: 500,
            summary: { totalGross: -20 },
        });
        expect(lockedProduct.stock).toBe(6);
        expect(lockedSourceSale.status).toBe(WarehouseSaleStatus.Refunded);

        const reversalSale = savedItems
            .filter((item) => item.saleNumber === 'S20260300501')
            .at(-1);
        expect(reversalSale).toMatchObject({
            kind: WarehouseSaleKind.Refund,
            sourceSaleId: 20,
            reversalReason: 'Refund test',
            totalGross: -20,
            discountGross: -1,
        });

        const reversalItem = savedItems.find(
            (item) => item.originalSaleItemId === 201,
        );
        expect(reversalItem).toMatchObject({
            saleId: 500,
            productId: 301,
            quantity: -2,
            totalGross: -20,
            discountGross: -1,
        });
    });

    test('createReversalSale rejects partial voids', async () => {
        const { service } = createService();

        jest.spyOn(
            service as unknown as { resolveReversalSelection: (...args: unknown[]) => Promise<unknown> },
            'resolveReversalSelection',
        ).mockResolvedValue([
            {
                sourceItem: { id: 1, quantity: 2 },
                quantity: 1,
                proportion: 0.5,
            },
        ]);
        jest.spyOn(
            service as unknown as { isFullReversal: (...args: unknown[]) => boolean },
            'isFullReversal',
        ).mockReturnValue(false);

        await expect(
            (
                service as unknown as {
                    createReversalSale: (
                        sourceSaleArg: unknown,
                        dto: unknown,
                        actorArg: User,
                        kind: WarehouseSaleKind,
                    ) => Promise<unknown>;
                }
            ).createReversalSale(
                { id: 1, items: [{ id: 1, quantity: 2 }] },
                {},
                { id: 2 } as User,
                WarehouseSaleKind.Void,
            ),
        ).rejects.toThrow('Void must reverse the full remaining sale quantity');
    });
});
