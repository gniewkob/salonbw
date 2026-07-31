import { Between, Repository } from 'typeorm';
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
            return [{ exists: null }];
        }
        if (sql.includes('FROM warehouse_sales')) {
            return warehouseSaleRows;
        }
        return [];
    });

    const appointmentRepository: MockRepository<Appointment> = {
        find: jest.fn().mockResolvedValue(appointments),
        query,
    };
    const userRepository: MockRepository<User> = {
        find: jest.fn().mockResolvedValue(employees),
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
});
