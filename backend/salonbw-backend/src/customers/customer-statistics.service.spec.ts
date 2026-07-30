import { Repository } from 'typeorm';
import { CustomerStatisticsService } from './customer-statistics.service';
import {
    Appointment,
    AppointmentStatus,
} from '../appointments/appointment.entity';
import { User } from '../users/user.entity';
import { Formula } from '../formulas/formula.entity';

describe('CustomerStatisticsService', () => {
    const createAppointmentsRepo = () => {
        const qb = {
            leftJoinAndSelect: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            addSelect: jest.fn().mockReturnThis(),
            groupBy: jest.fn().mockReturnThis(),
            setParameter: jest.fn().mockReturnThis(),
            take: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            getMany: jest.fn(),
            getRawMany: jest.fn(),
            getManyAndCount: jest.fn(),
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

    const createFormulasRepo = () => {
        const qb = {
            leftJoin: jest.fn().mockReturnThis(),
            addSelect: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            getMany: jest.fn().mockResolvedValue([]),
        };

        const repo = {
            createQueryBuilder: jest.fn().mockReturnValue(qb),
        } as unknown as Repository<Formula>;

        return { repo, qb };
    };

    it('includes retail totals and favorite products when product sales are linked by appointment', async () => {
        const { repo: appointmentsRepo, qb } = createAppointmentsRepo();
        const usersRepo = {} as Repository<User>;
        const formulasRepo = createFormulasRepo();
        const service = new CustomerStatisticsService(
            appointmentsRepo,
            usersRepo,
            formulasRepo.repo,
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

    it('does not double-count product revenue when both product_sales and warehouse_sales exist', async () => {
        const { repo: appointmentsRepo, qb } = createAppointmentsRepo();
        const usersRepo = {} as Repository<User>;
        const formulasRepo = createFormulasRepo();
        const service = new CustomerStatisticsService(
            appointmentsRepo,
            usersRepo,
            formulasRepo.repo,
        );

        qb.getMany.mockResolvedValue([
            {
                id: 1,
                startTime: '2026-03-03T10:00:00.000Z',
                status: AppointmentStatus.Completed,
                paidAmount: 185,
                service: { id: 11, name: 'Strzyżenie', price: 70 },
                employee: { id: 21, name: 'Anna' },
            },
        ]);

        (appointmentsRepo.query as jest.Mock).mockImplementation(
            async (sql: string, params?: unknown[]) => {
                if (sql.includes('to_regclass')) {
                    const tableName = params?.[0];
                    if (
                        tableName === 'public.product_sales' ||
                        tableName === 'public.warehouse_sales'
                    ) {
                        return [{ exists: tableName }];
                    }
                    return [{ exists: null }];
                }
                if (sql.includes('FROM product_sales')) {
                    throw new Error(
                        'legacy product_sales must not be queried when warehouse_sales exists',
                    );
                }
                if (
                    sql.includes('FROM warehouse_sales') &&
                    sql.includes('GROUP BY month')
                ) {
                    return [{ month: '2026-03', spent: '35' }];
                }
                if (sql.includes(`GROUP BY wsi."productId"`)) {
                    return [
                        {
                            productId: '858',
                            productName: 'SYNTHETIC Produkt 05',
                            count: '1',
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

        expect(stats.productSpent).toBe(35);
        expect(stats.favoriteProducts).toEqual([
            {
                productId: 858,
                productName: 'SYNTHETIC Produkt 05',
                count: 1,
            },
        ]);
    });

    it('returns zero retail stats when product sales table is unavailable', async () => {
        const { repo: appointmentsRepo, qb } = createAppointmentsRepo();
        const usersRepo = {} as Repository<User>;
        const formulasRepo = createFormulasRepo();
        const service = new CustomerStatisticsService(
            appointmentsRepo,
            usersRepo,
            formulasRepo.repo,
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

    it('uses aggregated query for alerts batch scope', async () => {
        const { repo: appointmentsRepo, qb } = createAppointmentsRepo();
        const usersRepo = {} as Repository<User>;
        const formulasRepo = createFormulasRepo();
        const service = new CustomerStatisticsService(
            appointmentsRepo,
            usersRepo,
            formulasRepo.repo,
        );

        qb.getRawMany.mockResolvedValue([
            { customerId: '7', noShowVisits: '2' },
            { customerId: '8', noShowVisits: '0' },
        ]);

        const batch = await service.getStatisticsBatch(
            [7, 8, 9],
            undefined,
            'alerts',
        );

        expect(qb.select).toHaveBeenCalledWith('apt.clientId', 'customerId');
        expect(qb.groupBy).toHaveBeenCalledWith('apt.clientId');
        expect(qb.setParameter).toHaveBeenCalledWith(
            'noShowStatus',
            AppointmentStatus.NoShow,
        );
        expect(batch).toEqual([
            {
                customerId: 7,
                statistics: expect.objectContaining({ noShowVisits: 2 }),
            },
            {
                customerId: 8,
                statistics: expect.objectContaining({ noShowVisits: 0 }),
            },
            {
                customerId: 9,
                statistics: expect.objectContaining({ noShowVisits: 0 }),
            },
        ]);
    });

    it('attaches the latest formula description to its appointment in event history', async () => {
        const { repo: appointmentsRepo, qb } = createAppointmentsRepo();
        const usersRepo = {} as Repository<User>;
        const formulasRepo = createFormulasRepo();
        const service = new CustomerStatisticsService(
            appointmentsRepo,
            usersRepo,
            formulasRepo.repo,
        );

        qb.getManyAndCount = jest.fn().mockResolvedValue([
            [
                {
                    id: 182,
                    startTime: new Date('2026-07-30T14:30:00.000Z'),
                    status: AppointmentStatus.Completed,
                    paidAmount: 185,
                    service: { id: 3, name: 'Strzyżenie' },
                    employee: { id: 21, name: 'Anna' },
                },
            ],
            1,
        ]);

        formulasRepo.qb.getMany.mockResolvedValue([
            {
                id: 1,
                description: 'Farba 7.1 + 6% 1:1',
                date: new Date('2026-07-30T15:30:00.000Z'),
                appointment: { id: 182 },
            },
        ]);

        const history = await service.getEventHistory(86);

        // Formula.appointment is `eager: true`, but QueryBuilder does NOT
        // auto-join eager relations (only repo.find() does) — regression
        // guard for a bug where `formula.appointment` silently stayed
        // undefined because this join was missing.
        expect(formulasRepo.qb.leftJoin).toHaveBeenCalledWith(
            'formula.appointment',
            'appointment',
        );
        expect(formulasRepo.qb.addSelect).toHaveBeenCalledWith(
            'appointment.id',
        );
        expect(formulasRepo.qb.where).toHaveBeenCalledWith(
            'formula.appointmentId IN (:...ids)',
            { ids: [182] },
        );
        expect(history.items[0].formula).toBe('Farba 7.1 + 6% 1:1');
    });

    it('leaves formula null when the appointment has no recorded formula', async () => {
        const { repo: appointmentsRepo, qb } = createAppointmentsRepo();
        const usersRepo = {} as Repository<User>;
        const formulasRepo = createFormulasRepo();
        const service = new CustomerStatisticsService(
            appointmentsRepo,
            usersRepo,
            formulasRepo.repo,
        );

        qb.getManyAndCount = jest.fn().mockResolvedValue([
            [
                {
                    id: 999,
                    startTime: new Date('2026-07-16T12:00:00.000Z'),
                    status: AppointmentStatus.NoShow,
                    paidAmount: 70,
                    service: { id: 3, name: 'Strzyżenie' },
                    employee: { id: 21, name: 'Anna' },
                },
            ],
            1,
        ]);

        const history = await service.getEventHistory(86);

        expect(history.items[0].formula).toBeNull();
    });
});
