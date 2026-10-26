import { Between, Repository } from 'typeorm';
import { Client } from 'pg';
import { StatisticsService } from './statistics.service';
import {
    Appointment,
    AppointmentStatus,
} from '../appointments/appointment.entity';
import { User } from '../users/user.entity';
import { Review } from '../reviews/review.entity';
import { Commission } from '../commissions/commission.entity';
import { Timetable } from '../timetables/entities/timetable.entity';
import { TimetableException } from '../timetables/entities/timetable-exception.entity';
import { ProductMovement } from '../warehouse/entities/product-movement.entity';
import { Product } from '../products/product.entity';
import { Role } from '../users/role.enum';
import { GroupBy } from './dto/statistics.dto';

type MockRepository<T extends object> = Partial<
    Record<keyof Repository<T>, jest.Mock>
> & {
    createQueryBuilder?: jest.Mock;
};

interface WarehouseSaleRow {
    appointmentId: number | null;
    employeeId: number | null;
    soldAt: string;
    revenue: number;
}

function createStatisticsService({
    appointments = [],
    employees = [],
    reviewRows = [],
    hasWarehouseSales = false,
    hasLegacySales = false,
    warehouseSaleRows = [],
}: {
    appointments?: Partial<Appointment>[];
    employees?: Partial<User>[];
    reviewRows?: Array<{
        employeeId: string;
        avg: string | null;
        count: string;
    }>;
    hasWarehouseSales?: boolean;
    hasLegacySales?: boolean;
    warehouseSaleRows?: WarehouseSaleRow[];
}) {
    const query = jest.fn(async (sql: string, params?: unknown[]) => {
        if (sql.includes('to_regclass')) {
            const table = params?.[0];
            if (table === 'public.warehouse_sales') {
                return hasWarehouseSales
                    ? [{ exists: 'warehouse_sales' }]
                    : [{ exists: null }];
            }
            if (table === 'public.product_sales' && hasLegacySales)
                return [{ exists: 'product_sales' }];
            return [{ exists: null }];
        }
        if (
            sql.includes('FROM warehouse_sales') ||
            sql.includes('FROM product_sales')
        ) {
            if (Array.isArray(params?.[0])) {
                const ids = new Set(params[0] as number[]);
                return warehouseSaleRows.filter(
                    (row) =>
                        row.appointmentId != null && ids.has(row.appointmentId),
                );
            }
            const [from, to] = params as Date[];
            return warehouseSaleRows.filter(
                (row) =>
                    new Date(row.soldAt) >= from && new Date(row.soldAt) <= to,
            );
        }
        return [];
    });

    const appointmentRepository: MockRepository<Appointment> = {
        find: jest.fn().mockResolvedValue(appointments),
        query,
    };
    const userRepository: MockRepository<User> = {
        find: jest.fn(
            async (args?: {
                where?: { role?: Role; id?: { value?: unknown } };
            }) => {
                const where = args?.where;
                if (where?.role === Role.Employee) {
                    return employees.filter((e) => e.role === Role.Employee);
                }
                if (where?.id) {
                    // TypeORM's In(ids) FindOperator exposes the array via .value.
                    const ids = new Set(
                        (where.id.value as (number | string)[]) ?? [],
                    );
                    return employees.filter(
                        (e) => e.id != null && ids.has(e.id),
                    );
                }
                return employees;
            },
        ),
    };
    const reviewRepository: MockRepository<Review> = {
        createQueryBuilder: jest.fn(() => ({
            innerJoin: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            addSelect: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            groupBy: jest.fn().mockReturnThis(),
            getRawMany: jest.fn().mockResolvedValue(reviewRows),
        })),
    };

    const service = new StatisticsService(
        appointmentRepository as Repository<Appointment>,
        userRepository as Repository<User>,
        reviewRepository as Repository<Review>,
        {} as Repository<Timetable>,
        {} as Repository<TimetableException>,
        {} as Repository<Commission>,
        {} as Repository<ProductMovement>,
        {} as Repository<Product>,
    );

    return {
        service,
        appointmentRepository,
        userRepository,
    };
}

describe('StatisticsService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getEmployeeRanking', () => {
        it('keeps employees with zero appointments in employee ranking', async () => {
            const from = new Date('2026-03-01T00:00:00.000Z');
            const to = new Date('2026-03-31T23:59:59.999Z');

            const { service, appointmentRepository, userRepository } =
                createStatisticsService({
                    employees: [
                        { id: 1, name: 'Anna', role: Role.Employee },
                        { id: 2, name: 'Bartek', role: Role.Employee },
                    ],
                    appointments: [
                        {
                            id: 10,
                            employeeId: 1,
                            startTime: new Date('2026-03-10T10:00:00.000Z'),
                            status: AppointmentStatus.Completed,
                            tipAmount: 20,
                            paidAmount: 100,
                            service: {
                                duration: 60,
                                price: 100,
                            } as Appointment['service'],
                            serviceVariant: null,
                        },
                    ],
                    reviewRows: [
                        {
                            employeeId: '1',
                            avg: '4.5',
                            count: '2',
                        },
                    ],
                });

            const result = await service.getEmployeeRanking(from, to);

            expect(userRepository.find).toHaveBeenCalledWith({
                where: { role: Role.Employee },
            });
            expect(appointmentRepository.find).toHaveBeenCalledWith({
                where: {
                    startTime: Between(from, to),
                    status: AppointmentStatus.Completed,
                },
                relations: ['service', 'serviceVariant'],
            });
            // revenue = paidAmount(100) − tipAmount(20) − productSales(0) =
            // 80, NOT the raw paidAmount(100). This is the finding-#4 fix:
            // paidAmount is the full transaction total, not pure service
            // revenue.
            expect(result).toEqual([
                expect.objectContaining({
                    employeeId: 1,
                    employeeName: 'Anna',
                    revenue: 80,
                    appointments: 1,
                    completedAppointments: 1,
                    rating: 4.5,
                    reviewCount: 2,
                }),
                expect.objectContaining({
                    employeeId: 2,
                    employeeName: 'Bartek',
                    revenue: 0,
                    appointments: 0,
                    completedAppointments: 0,
                    rating: 0,
                    reviewCount: 0,
                }),
            ]);
        });

        it('also subtracts product sales linked to the same appointment from revenue', async () => {
            const from = new Date('2026-07-01T00:00:00.000Z');
            const to = new Date('2026-07-31T23:59:59.999Z');

            const { service } = createStatisticsService({
                employees: [
                    { id: 21, name: 'Aleksandra', role: Role.Employee },
                ],
                appointments: [
                    {
                        id: 182,
                        employeeId: 21,
                        startTime: new Date('2026-07-30T14:30:00.000Z'),
                        status: AppointmentStatus.Completed,
                        tipAmount: 20,
                        paidAmount: 185,
                        discount: 10,
                        service: {
                            duration: 45,
                            price: 70,
                        } as Appointment['service'],
                        serviceVariant: null,
                    },
                ],
                hasWarehouseSales: true,
                warehouseSaleRows: [
                    {
                        appointmentId: 182,
                        employeeId: 21,
                        soldAt: '2026-07-30T14:34:00.000Z',
                        revenue: 35,
                    },
                ],
            });

            const result = await service.getEmployeeRanking(from, to);

            // 185 paid − 20 tip − 35 product sale = 130 (70 service + 70
            // addon-equivalent − 10 discount, matching the live UAT figure).
            expect(result[0]).toEqual(
                expect.objectContaining({ employeeId: 21, revenue: 130 }),
            );
        });

        it('includes an admin who actually worked appointments, not just role=Employee users', async () => {
            // Single-operator salons run appointments under role=Admin
            // ("rola pracownik poza zakresem GO") — filtering strictly by
            // role: Employee silently dropped her from the named
            // per-employee breakdown even though the aggregate total was
            // correct.
            const from = new Date('2026-07-01T00:00:00.000Z');
            const to = new Date('2026-07-31T23:59:59.999Z');

            const { service } = createStatisticsService({
                employees: [
                    { id: 29, name: 'Aleksandra Bodora', role: Role.Admin },
                ],
                appointments: [
                    {
                        id: 200,
                        employeeId: 29,
                        startTime: new Date('2026-07-15T10:00:00.000Z'),
                        status: AppointmentStatus.Completed,
                        tipAmount: 0,
                        paidAmount: 70,
                        service: {
                            duration: 45,
                            price: 70,
                        } as Appointment['service'],
                        serviceVariant: null,
                    },
                ],
            });

            const result = await service.getEmployeeRanking(from, to);

            expect(result).toEqual([
                expect.objectContaining({
                    employeeId: 29,
                    employeeName: 'Aleksandra Bodora',
                    revenue: 70,
                    appointments: 1,
                }),
            ]);
        });
    });

    describe('getRevenueChart', () => {
        it('excludes tip and per-appointment product sales from the revenue series', async () => {
            const from = new Date('2026-07-30T00:00:00.000Z');
            const to = new Date('2026-07-30T23:59:59.999Z');

            const { service } = createStatisticsService({
                appointments: [
                    {
                        id: 182,
                        employeeId: 21,
                        startTime: new Date('2026-07-30T14:30:00.000Z'),
                        status: AppointmentStatus.Completed,
                        tipAmount: 20,
                        discount: 10,
                        paidAmount: 185,
                        service: {
                            duration: 45,
                            price: 70,
                        } as Appointment['service'],
                        serviceVariant: null,
                    },
                ],
                hasWarehouseSales: true,
                warehouseSaleRows: [
                    {
                        appointmentId: 182,
                        employeeId: 21,
                        soldAt: '2026-07-30T14:34:00.000Z',
                        revenue: 35,
                    },
                ],
            });

            const points = await service.getRevenueChart(from, to, GroupBy.Day);

            const day = points.find((p) => p.date === '2026-07-30');
            expect(day).toEqual(
                expect.objectContaining({
                    revenue: 130,
                    tips: 20,
                    discount: 10,
                    products: 35,
                }),
            );
        });
    });

    describe('getServiceRanking', () => {
        it('reports service-only revenue, excluding tip and product sales', async () => {
            const from = new Date('2026-07-30T00:00:00.000Z');
            const to = new Date('2026-07-30T23:59:59.999Z');

            const { service } = createStatisticsService({
                appointments: [
                    {
                        id: 182,
                        employeeId: 21,
                        startTime: new Date('2026-07-30T14:30:00.000Z'),
                        status: AppointmentStatus.Completed,
                        tipAmount: 20,
                        paidAmount: 185,
                        service: {
                            id: 3,
                            name: 'Strzyżenie dziecięce chłopcy',
                            duration: 45,
                            price: 70,
                        } as Appointment['service'],
                        serviceVariant: null,
                    },
                ],
                hasWarehouseSales: true,
                warehouseSaleRows: [
                    {
                        appointmentId: 182,
                        employeeId: 21,
                        soldAt: '2026-07-30T14:34:00.000Z',
                        revenue: 35,
                    },
                ],
            });

            const result = await service.getServiceRanking(from, to);

            expect(result).toEqual([
                expect.objectContaining({
                    serviceId: 3,
                    bookingCount: 1,
                    revenue: 130,
                    averagePrice: 130,
                }),
            ]);
        });
    });

    it('aggregates employee activity from a single appointment query', async () => {
        const date = new Date('2026-03-11T12:00:00.000Z');

        const { service, appointmentRepository } = createStatisticsService({
            employees: [
                { id: 1, name: 'Anna', role: Role.Employee },
                { id: 2, name: 'Bartek', role: Role.Employee },
            ],
            appointments: [
                {
                    id: 10,
                    employeeId: 1,
                    startTime: new Date('2026-03-11T09:00:00.000Z'),
                    endTime: new Date('2026-03-11T10:30:00.000Z'),
                    status: AppointmentStatus.Completed,
                },
                {
                    id: 11,
                    employeeId: 1,
                    startTime: new Date('2026-03-11T11:00:00.000Z'),
                    endTime: new Date('2026-03-11T12:00:00.000Z'),
                    status: AppointmentStatus.Completed,
                },
            ],
        });

        const result = await service.getEmployeeActivity(date);

        expect(appointmentRepository.find).toHaveBeenCalledTimes(1);
        expect(result.employees).toEqual([
            {
                employeeId: 1,
                employeeName: 'Anna',
                workTimeMinutes: 150,
                appointmentsCount: 2,
            },
            {
                employeeId: 2,
                employeeName: 'Bartek',
                workTimeMinutes: 0,
                appointmentsCount: 0,
            },
        ]);
        expect(result.totals).toEqual({
            workTimeMinutes: 150,
            appointmentsCount: 2,
        });
    });
    describe.each(['warehouse', 'legacy'])(
        'cross-date retail deduction (%s)',
        (storage) => {
            const from = new Date('2026-10-27T00:00:00+01:00');
            const to = new Date('2026-10-27T23:59:59+01:00');
            const make = (soldAt = '2026-10-26T12:00:00Z') =>
                createStatisticsService({
                    appointments: [
                        {
                            id: 2,
                            employeeId: 7,
                            startTime: new Date('2026-10-27T11:00:00Z'),
                            status: AppointmentStatus.Completed,
                            paidAmount: 240,
                            tipAmount: 15,
                            discount: 5,
                            service: {
                                id: 12,
                                name: 'UAT',
                                price: 30,
                                duration: 25,
                            } as Appointment['service'],
                        },
                    ],
                    employees: [{ id: 7, name: 'UAT', role: Role.Employee }],
                    hasWarehouseSales: storage === 'warehouse',
                    hasLegacySales: storage === 'legacy',
                    warehouseSaleRows: [
                        {
                            appointmentId: 2,
                            employeeId: 7,
                            soldAt,
                            revenue: 40,
                        },
                    ],
                });
            it('does not reclassify an earlier product sale as service revenue', async () => {
                const { service } = make();
                const chart = await service.getRevenueChart(
                    from,
                    to,
                    GroupBy.Day,
                );
                expect(chart[0]).toEqual(
                    expect.objectContaining({
                        revenue: 185,
                        products: 0,
                        tips: 15,
                    }),
                );
            });
            it('also deducts a linked sale finalized after the appointment date', async () => {
                const { service } = make('2026-10-28T12:00:00Z');
                const [day] = await service.getRevenueChart(
                    from,
                    to,
                    GroupBy.Day,
                );
                expect(day).toEqual(
                    expect.objectContaining({ revenue: 185, products: 0 }),
                );
            });
            it('keeps adjacent-day totals additive', async () => {
                const { service } = make();
                const previous = new Date('2026-10-26T00:00:00+01:00');
                const priorDay = await service.getRevenueChart(
                    previous,
                    new Date('2026-10-26T23:59:59+01:00'),
                    GroupBy.Day,
                );
                const day = await service.getRevenueChart(
                    from,
                    to,
                    GroupBy.Day,
                );
                const both = await service.getRevenueChart(
                    previous,
                    to,
                    GroupBy.Day,
                );
                const total = (rows: typeof both) =>
                    rows.reduce((sum, r) => sum + r.revenue + r.products, 0);
                expect(total(priorDay) + total(day)).toBe(225);
                expect(total(both)).toBe(225);
            });
            it('deducts products in employee and service rankings and commissions', async () => {
                const { service } = make();
                expect(
                    (await service.getEmployeeRanking(from, to))[0].revenue,
                ).toBe(185);
                expect(
                    (await service.getServiceRanking(from, to))[0].revenue,
                ).toBe(185);
                expect(
                    (await service.getCommissionReport(from, to)).totals,
                ).toEqual(
                    expect.objectContaining({
                        serviceRevenue: 185,
                        productRevenue: 0,
                        totalRevenue: 185,
                    }),
                );
            });
        },
    );
});

const statisticsPgUrl = process.env.STATISTICS_TEST_DATABASE_URL;
(statisticsPgUrl ? describe : describe.skip)(
    'cross-date retail PostgreSQL',
    () => {
        let db: Client;
        beforeAll(async () => {
            const url = new URL(statisticsPgUrl!);
            if (
                !['127.0.0.1', 'localhost'].includes(url.hostname) ||
                url.pathname !== '/statistics_synthetic'
            )
                throw Error('Dedicated local statistics database required');
            db = new Client({ connectionString: statisticsPgUrl });
            await db.connect();
        });
        afterAll(async () => {
            await db?.end();
        });
        it.each(['warehouse', 'legacy'])(
            'keeps date buckets and deductions separate in %s storage',
            async (storage) => {
                await db.query(
                    'DROP SCHEMA public CASCADE; CREATE SCHEMA public',
                );
                if (storage === 'warehouse') {
                    await db.query(`CREATE TABLE warehouse_sales(id int PRIMARY KEY, "appointmentId" int, "employeeId" int, "soldAt" timestamptz, kind text);
                CREATE TABLE warehouse_sale_items("saleId" int, "totalGross" numeric);
                INSERT INTO warehouse_sales VALUES (1,2,7,'2026-10-26T12:00:00Z','sale'),(2,999,7,'2026-10-24T12:00:00Z','sale');
                INSERT INTO warehouse_sale_items VALUES (1,40),(2,999);`);
                } else {
                    await db.query(`CREATE TABLE product_sales("appointmentId" int, "employeeId" int, "soldAt" timestamptz, quantity numeric, "unitPrice" numeric, discount numeric);
                INSERT INTO product_sales VALUES (2,7,'2026-10-26T12:00:00Z',2,20,0),(999,7,'2026-10-24T12:00:00Z',1,999,0);`);
                }
                const { service, appointmentRepository } =
                    createStatisticsService({
                        appointments: [
                            {
                                id: 2,
                                employeeId: 7,
                                startTime: new Date('2026-10-27T11:00:00Z'),
                                status: AppointmentStatus.Completed,
                                paidAmount: 240,
                                tipAmount: 15,
                            },
                        ],
                    });
                appointmentRepository.query = jest.fn(
                    async (sql: string, params?: unknown[]) =>
                        (await db.query(sql, params)).rows,
                );
                const to = new Date('2026-10-27T23:59:59+01:00');
                const day = await service.getRevenueChart(
                    new Date('2026-10-27T00:00:00+01:00'),
                    to,
                    GroupBy.Day,
                );
                expect(day[0]).toEqual(
                    expect.objectContaining({ revenue: 185, products: 0 }),
                );
                const both = await service.getRevenueChart(
                    new Date('2026-10-26T00:00:00+01:00'),
                    to,
                    GroupBy.Day,
                );
                expect(both.map((r) => r.revenue + r.products)).toEqual([
                    40, 185,
                ]);
            },
        );
    },
);
