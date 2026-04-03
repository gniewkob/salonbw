import { Repository } from 'typeorm';
import { CustomerStatisticsService } from './customer-statistics.service';
import {
    Appointment,
    AppointmentStatus,
} from '../appointments/appointment.entity';
import { User } from '../users/user.entity';

describe('CustomerStatisticsService', () => {
    const createAppointmentsRepo = () => {
        const qb = {
            leftJoinAndSelect: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            getMany: jest.fn(),
        };

        const repo = {
            createQueryBuilder: jest.fn().mockReturnValue(qb),
            query: jest.fn(),
        } as unknown as Repository<Appointment>;

        return {
            repo,
            qb,
        };
    };

    it('includes retail totals and favorite products when product sales are linked by appointment', async () => {
        const { repo: appointmentsRepo, qb } = createAppointmentsRepo();
        const usersRepo = {} as Repository<User>;
        const service = new CustomerStatisticsService(
            appointmentsRepo,
            usersRepo,
        );

        qb.getMany.mockResolvedValue([
            {
                id: 1,
                startTime: '2026-03-03T10:00:00.000Z',
                status: AppointmentStatus.Completed,
                paidAmount: 100,
                service: { id: 11, name: 'Koloryzacja', price: 100 },
                employee: { id: 21, name: 'Anna' },
            },
            {
                id: 2,
                startTime: '2026-03-10T11:00:00.000Z',
                status: AppointmentStatus.Completed,
                paidAmount: 50,
                service: { id: 12, name: 'Strzyżenie', price: 50 },
                employee: { id: 21, name: 'Anna' },
            },
            {
                id: 3,
                startTime: '2026-03-12T12:00:00.000Z',
                status: AppointmentStatus.Cancelled,
                paidAmount: 0,
                service: { id: 13, name: 'Modelowanie', price: 80 },
                employee: { id: 22, name: 'Ola' },
            },
        ]);

        (appointmentsRepo.query as jest.Mock).mockImplementation(
            async (sql: string, params?: unknown[]) => {
                if (sql.includes('to_regclass')) {
                    const tableName = params?.[0];
                    if (tableName === 'public.product_sales') {
                        return [{ exists: 'product_sales' }];
                    }
                    return [{ exists: null }];
                }
                if (
                    sql.includes('FROM product_sales') &&
                    sql.includes('GROUP BY month')
                ) {
                    return [{ month: '2026-03', spent: '40' }];
                }
                if (sql.includes('GROUP BY ps."productId"')) {
                    return [
                        {
                            productId: '91',
                            productName: 'Szampon',
                            count: '3',
                        },
                    ];
                }
                return [];
            },
        );

        const stats = await service.getStatistics(7, {
            from: '2026-03-01',
            to: '2026-03-31',
        });

        expect(stats.completedVisits).toBe(2);
        expect(stats.totalSpent).toBe(190);
        expect(stats.serviceSpent).toBe(150);
        expect(stats.productSpent).toBe(40);
        expect(stats.averageSpent).toBe(95);
        expect(stats.favoriteProducts).toEqual([
            {
                productId: 91,
                productName: 'Szampon',
                count: 3,
            },
        ]);
        expect(stats.visitsByMonth).toEqual([
            {
                month: '2026-03',
                count: 2,
                spent: 190,
                serviceSpent: 150,
                productSpent: 40,
            },
        ]);
    });

    it('returns zero retail stats when product sales table is unavailable', async () => {
        const { repo: appointmentsRepo, qb } = createAppointmentsRepo();
        const usersRepo = {} as Repository<User>;
        const service = new CustomerStatisticsService(
            appointmentsRepo,
            usersRepo,
        );

        qb.getMany.mockResolvedValue([
            {
                id: 1,
                startTime: '2026-03-03T10:00:00.000Z',
                status: AppointmentStatus.Completed,
                paidAmount: 120,
                service: { id: 11, name: 'Koloryzacja', price: 120 },
                employee: { id: 21, name: 'Anna' },
            },
        ]);

        (appointmentsRepo.query as jest.Mock).mockResolvedValue([
            { exists: null },
        ]);

        const stats = await service.getStatistics(7, {
            from: '2026-03-01',
            to: '2026-03-31',
        });

        expect(stats.totalSpent).toBe(120);
        expect(stats.serviceSpent).toBe(120);
        expect(stats.productSpent).toBe(0);
        expect(stats.favoriteProducts).toEqual([]);
        expect(stats.visitsByMonth).toEqual([
            {
                month: '2026-03',
                count: 1,
                spent: 120,
                serviceSpent: 120,
                productSpent: 0,
            },
        ]);
    });
});
