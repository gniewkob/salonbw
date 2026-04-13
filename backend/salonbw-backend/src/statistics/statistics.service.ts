import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
    Repository,
    Between,
    MoreThanOrEqual,
    LessThanOrEqual,
    In,
} from 'typeorm';
import {
    startOfDay,
    endOfDay,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    startOfYear,
    subDays,
    subWeeks,
    subMonths,
    format,
    eachDayOfInterval,
    eachWeekOfInterval,
    eachMonthOfInterval,
} from 'date-fns';
import { pl } from 'date-fns/locale';
import {
    Appointment,
    AppointmentStatus,
} from '../appointments/appointment.entity';
import { User } from '../users/user.entity';
import { Review } from '../reviews/review.entity';
import { Commission } from '../commissions/commission.entity';
import { Timetable } from '../timetables/entities/timetable.entity';
import {
    TimetableException,
    ExceptionType,
} from '../timetables/entities/timetable-exception.entity';
import { DayOfWeek } from '../timetables/entities/timetable-slot.entity';
import {
    DateRange,
    GroupBy,
    DashboardStats,
    RevenueDataPoint,
    EmployeeStats,
    EmployeeActivity,
    EmployeeActivitySummary,
    ServiceStats,
    CustomerStats,
    CustomerReturningStats,
    CustomerOriginStats,
    CashRegisterSummary,
    CashRegisterEntry,
    TipsSummary,
    CommissionReport,
    CommissionReportSummary,
    WarehouseMovementStats,
    WarehouseValueStats,
    WorkTimeReport,
} from './dto/statistics.dto';
import { Role } from '../users/role.enum';
import {
    ProductMovement,
    MovementType,
} from '../warehouse/entities/product-movement.entity';
import { Product } from '../products/product.entity';

@Injectable()
export class StatisticsService {
    private static readonly RECEPTION_EMPLOYEE_ID = 0;
    private static readonly RECEPTION_EMPLOYEE_NAME = 'Recepcja';

    constructor(
        @InjectRepository(Appointment)
        private readonly appointmentRepository: Repository<Appointment>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Review)
        private readonly reviewRepository: Repository<Review>,
        @InjectRepository(Timetable)
        private readonly timetableRepository: Repository<Timetable>,
        @InjectRepository(TimetableException)
        private readonly timetableExceptionRepository: Repository<TimetableException>,
        @InjectRepository(Commission)
        private readonly commissionRepository: Repository<Commission>,
        @InjectRepository(ProductMovement)
        private readonly productMovementRepository: Repository<ProductMovement>,
        @InjectRepository(Product)
        private readonly productRepository: Repository<Product>,
    ) {}

    async getDashboard(): Promise<DashboardStats> {
        const now = new Date();
        const todayStart = startOfDay(now);
        const todayEnd = endOfDay(now);
        const weekStart = startOfWeek(now, { weekStartsOn: 1 });
        const monthStart = startOfMonth(now);
        const dayKeys = eachDayOfInterval({
            start: monthStart,
            end: todayStart,
        }).map((day) => format(day, 'yyyy-MM-dd'));

        const [
            todayAppointments,
            todayNewCustomers,
            weekAppointments,
            monthCompletedAppointments,
            monthAllAppointments,
            monthNewClients,
            pendingAppointments,
            ratingResult,
        ] = await Promise.all([
            this.appointmentRepository.find({
                where: {
                    startTime: Between(todayStart, todayEnd),
                },
                relations: ['service', 'serviceVariant'],
            }),
            this.userRepository.count({
                where: {
                    role: Role.Customer,
                    createdAt: Between(todayStart, todayEnd),
                },
            }),
            this.appointmentRepository.find({
                where: {
                    startTime: Between(weekStart, todayEnd),
                    status: AppointmentStatus.Completed,
                },
                relations: ['service', 'serviceVariant'],
            }),
            this.appointmentRepository.find({
                where: {
                    startTime: Between(monthStart, todayEnd),
                    status: AppointmentStatus.Completed,
                },
                relations: ['service', 'serviceVariant'],
            }),
            this.appointmentRepository.find({
                where: {
                    startTime: Between(monthStart, todayEnd),
                },
                select: {
                    id: true,
                    startTime: true,
                },
            }),
            this.userRepository.find({
                where: {
                    role: Role.Customer,
                    createdAt: Between(monthStart, todayEnd),
                },
                select: {
                    id: true,
                    createdAt: true,
                },
            }),
            this.appointmentRepository.count({
                where: {
                    startTime: MoreThanOrEqual(now),
                    status: AppointmentStatus.Scheduled,
                },
            }),
            this.reviewRepository
                .createQueryBuilder('review')
                .select('AVG(review.rating)', 'avg')
                .getRawOne(),
        ]);

        const todayCompleted = todayAppointments.filter(
            (appointment) => appointment.status === AppointmentStatus.Completed,
        );

        const serviceRevenueByDay = new Map<string, number>();
        for (const appointment of monthCompletedAppointments) {
            const dayKey = format(
                new Date(appointment.startTime),
                'yyyy-MM-dd',
            );
            serviceRevenueByDay.set(
                dayKey,
                (serviceRevenueByDay.get(dayKey) ?? 0) +
                    this.resolveAppointmentPrice(appointment),
            );
        }

        const appointmentCountByDay = new Map<string, number>();
        for (const appointment of monthAllAppointments) {
            const dayKey = format(
                new Date(appointment.startTime),
                'yyyy-MM-dd',
            );
            appointmentCountByDay.set(
                dayKey,
                (appointmentCountByDay.get(dayKey) ?? 0) + 1,
            );
        }

        const newCustomersByDay = new Map<string, number>();
        for (const client of monthNewClients) {
            const dayKey = format(new Date(client.createdAt), 'yyyy-MM-dd');
            newCustomersByDay.set(dayKey, (newCustomersByDay.get(dayKey) ?? 0) + 1);
        }

        let productRevenueByDay = new Map<string, number>();
        const hasProductSales = await this.hasTable('public.product_sales');
        if (hasProductSales) {
            const rows = await this.appointmentRepository.query(
                `SELECT TO_CHAR(DATE_TRUNC('day', "soldAt"), 'YYYY-MM-DD') AS bucket,
                        COALESCE(SUM(quantity * "unitPrice" - COALESCE(discount, 0)), 0) AS revenue
                 FROM product_sales
                 WHERE "soldAt" BETWEEN $1 AND $2
                 GROUP BY bucket`,
                [monthStart, todayEnd],
            );
            productRevenueByDay = new Map(
                rows.map(
                    (row: { bucket: string; revenue: string | number }) => [
                        row.bucket,
                        Number(row.revenue ?? 0),
                    ],
                ),
            );
        }

        const todayKey = format(todayStart, 'yyyy-MM-dd');
        const todayServiceRevenue = todayCompleted.reduce(
            (sum, appointment) =>
                sum + this.resolveAppointmentPrice(appointment),
            0,
        );
        const todayProductRevenue = productRevenueByDay.get(todayKey) ?? 0;
        const weekProductRevenue = dayKeys
            .filter((dayKey) => {
                const date = new Date(`${dayKey}T00:00:00`);
                return date >= weekStart && date <= todayStart;
            })
            .reduce(
                (sum, dayKey) => sum + (productRevenueByDay.get(dayKey) ?? 0),
                0,
            );
        const monthProductRevenue = dayKeys.reduce(
            (sum, dayKey) => sum + (productRevenueByDay.get(dayKey) ?? 0),
            0,
        );
        const weekServiceRevenue = weekAppointments.reduce(
            (sum, appointment) =>
                sum + this.resolveAppointmentPrice(appointment),
            0,
        );
        const monthServiceRevenue = monthCompletedAppointments.reduce(
            (sum, appointment) =>
                sum + this.resolveAppointmentPrice(appointment),
            0,
        );

        const monthDailyAppointments = dayKeys.map((dayKey) => ({
            date: dayKey,
            count: appointmentCountByDay.get(dayKey) ?? 0,
        }));
        const monthDailyNewCustomers = dayKeys.map((dayKey) => ({
            date: dayKey,
            count: newCustomersByDay.get(dayKey) ?? 0,
        }));
        const monthDailyRevenue = dayKeys.map((dayKey) => {
            const serviceRevenue = serviceRevenueByDay.get(dayKey) ?? 0;
            const productRevenue = productRevenueByDay.get(dayKey) ?? 0;
            return {
                date: dayKey,
                serviceRevenue,
                productRevenue,
                totalRevenue: serviceRevenue + productRevenue,
            };
        });

        return {
            todayRevenue: todayServiceRevenue + todayProductRevenue,
            todayProductRevenue,
            todayAppointments: todayAppointments.length,
            todayCompletedAppointments: todayCompleted.length,
            todayNewCustomers,
            weekRevenue: weekServiceRevenue + weekProductRevenue,
            weekProductRevenue,
            weekAppointments: weekAppointments.length,
            monthRevenue: monthServiceRevenue + monthProductRevenue,
            monthProductRevenue,
            monthAppointments: monthCompletedAppointments.length,
            pendingAppointments,
            averageRating: parseFloat(ratingResult?.avg ?? '0') || 0,
            monthDailyAppointments,
            monthDailyNewCustomers,
            monthDailyRevenue,
        };
    }

    async getRevenueChart(
        from: Date,
        to: Date,
        groupBy: GroupBy = GroupBy.Day,
        employeeId?: number,
    ): Promise<RevenueDataPoint[]> {
        const qb = this.appointmentRepository
            .createQueryBuilder('apt')
            .leftJoin('apt.service', 'srv')
            .leftJoin('apt.serviceVariant', 'var')
            .select('apt.startTime', 'startTime')
            .addSelect('COALESCE(apt.paidAmount, COALESCE(var.price, srv.price, 0))', 'revenue')
            .addSelect('COALESCE(apt.tipAmount, 0)', 'tips')
            .where('apt.startTime BETWEEN :from AND :to', { from, to })
            .andWhere('apt.status = :status', { status: AppointmentStatus.Completed });

        if (employeeId) {
            qb.andWhere('apt.employeeId = :employeeId', { employeeId });
        }

        const appointments = await qb.getRawMany<{
            startTime: string | Date;
            revenue: string | number;
            tips: string | number;
        }>();

        let productSalesByBucket = new Map<string, number>();
        const hasProductSales = await this.hasTable('public.product_sales');
        if (hasProductSales) {
            const bucketExpr =
                groupBy === GroupBy.Month
                    ? `DATE_TRUNC('month', "soldAt")`
                    : groupBy === GroupBy.Week
                      ? `DATE_TRUNC('week', "soldAt")`
                      : `DATE_TRUNC('day', "soldAt")`;
            const employeeFilter =
                employeeId !== undefined ? 'AND "employeeId" = $3' : '';
            const rows = await this.appointmentRepository.query(
                `SELECT TO_CHAR(${bucketExpr}, 'YYYY-MM-DD') AS bucket,
                        COALESCE(SUM(quantity * "unitPrice" - COALESCE(discount, 0)), 0) AS revenue
                 FROM product_sales
                 WHERE "soldAt" BETWEEN $1 AND $2
                 ${employeeFilter}
                 GROUP BY bucket`,
                employeeId !== undefined ? [from, to, employeeId] : [from, to],
            );
            productSalesByBucket = new Map(
                rows.map(
                    (row: { bucket: string; revenue: string | number }) => [
                        row.bucket,
                        Number(row.revenue ?? 0),
                    ],
                ),
            );
        }

        // Generate date intervals
        let intervals: Date[];
        let formatStr: string;

        switch (groupBy) {
            case GroupBy.Week:
                intervals = eachWeekOfInterval(
                    { start: from, end: to },
                    { weekStartsOn: 1 },
                );
                formatStr = "'Tydz.' w";
                break;
            case GroupBy.Month:
                intervals = eachMonthOfInterval({ start: from, end: to });
                formatStr = 'LLLL yyyy';
                break;
            default:
                intervals = eachDayOfInterval({ start: from, end: to });
                formatStr = 'd MMM';
        }

        const dataPoints: RevenueDataPoint[] = intervals.map((date) => {
            let rangeStart: Date;
            let rangeEnd: Date;

            switch (groupBy) {
                case GroupBy.Week:
                    rangeStart = startOfWeek(date, { weekStartsOn: 1 });
                    rangeEnd = endOfWeek(date, { weekStartsOn: 1 });
                    break;
                case GroupBy.Month:
                    rangeStart = startOfMonth(date);
                    rangeEnd = endOfMonth(date);
                    break;
                default:
                    rangeStart = startOfDay(date);
                    rangeEnd = endOfDay(date);
            }

            const periodAppointments = appointments.filter((a) => {
                const aDate = new Date(a.startTime);
                return aDate >= rangeStart && aDate <= rangeEnd;
            });

            const revenue = periodAppointments.reduce(
                (sum, a) => sum + this.parseMoney(a.revenue),
                0,
            );
            const tips = periodAppointments.reduce(
                (sum, a) => sum + this.parseMoney(a.tips),
                0,
            );

            return {
                date: format(date, 'yyyy-MM-dd'),
                label: format(date, formatStr, { locale: pl }),
                revenue,
                appointments: periodAppointments.length,
                tips,
                products:
                    productSalesByBucket.get(
                        format(rangeStart, 'yyyy-MM-dd'),
                    ) ?? 0,
            };
        });

        return dataPoints;
    }

    async getEmployeeRanking(from: Date, to: Date): Promise<EmployeeStats[]> {
        const [employees, aptStats, reviewRows] = await Promise.all([
            this.userRepository.find({
                where: { role: Role.Employee },
                select: ['id', 'name'],
            }),
            this.appointmentRepository.createQueryBuilder('apt')
                .leftJoin('apt.service', 'srv')
                .leftJoin('apt.serviceVariant', 'var')
                .select('apt.employeeId', 'employeeId')
                .addSelect('COUNT(apt.id)', 'appointments')
                .addSelect('SUM(COALESCE(apt.paidAmount, COALESCE(var.price, srv.price, 0)))', 'revenue')
                .addSelect('SUM(COALESCE(apt.tipAmount, 0))', 'tips')
                .addSelect('SUM(COALESCE(var.duration, srv.duration, 0))', 'totalDuration')
                .where('apt.startTime BETWEEN :from AND :to', { from, to })
                .andWhere('apt.status = :status', { status: AppointmentStatus.Completed })
                .groupBy('apt.employeeId')
                .getRawMany(),
            this.reviewRepository
                .createQueryBuilder('review')
                .innerJoin('review.appointment', 'appointment')
                .select('appointment.employeeId', 'employeeId')
                .addSelect('AVG(review.rating)', 'avg')
                .addSelect('COUNT(*)', 'count')
                .where('appointment.startTime BETWEEN :from AND :to', {
                    from,
                    to,
                })
                .groupBy('appointment.employeeId')
                .getRawMany<{
                    employeeId: string;
                    avg: string | null;
                    count: string;
                }>(),
        ]);

        const statsByEmployee = new Map(
            aptStats.map((row) => [
                Number(row.employeeId),
                {
                    appointments: Number(row.appointments || 0),
                    revenue: this.parseMoney(row.revenue || 0),
                    tips: this.parseMoney(row.tips || 0),
                    totalDuration: Number(row.totalDuration || 0),
                },
            ])
        );

        const reviewsByEmployee = new Map<
            number,
            { avg: number; count: number }
        >(
            reviewRows.map((row) => [
                Number(row.employeeId),
                {
                    avg: parseFloat(row.avg ?? '0') || 0,
                    count: parseInt(row.count ?? '0', 10),
                },
            ]),
        );

        const stats = employees.map((employee) => {
            const empStats = statsByEmployee.get(employee.id) ?? {
                appointments: 0,
                revenue: 0,
                tips: 0,
                totalDuration: 0,
            };
            const reviews = reviewsByEmployee.get(employee.id);

            return {
                employeeId: employee.id,
                employeeName: employee.name,
                revenue: empStats.revenue,
                appointments: empStats.appointments,
                completedAppointments: empStats.appointments,
                averageDuration:
                    empStats.appointments > 0
                        ? Math.round(empStats.totalDuration / empStats.appointments)
                        : 0,
                averageRevenue:
                    empStats.appointments > 0
                        ? this.parseMoney(empStats.revenue / empStats.appointments)
                        : 0,
                tips: empStats.tips,
                rating: reviews?.avg ?? 0,
                reviewCount: reviews?.count ?? 0,
            };
        });

        // Sort by revenue descending
        return stats.sort((a, b) => b.revenue - a.revenue);
    }

    async getServiceRanking(from: Date, to: Date): Promise<ServiceStats[]> {
        const result = await this.appointmentRepository
            .createQueryBuilder('appointment')
            .innerJoin('appointment.service', 'service')
            .leftJoin('appointment.serviceVariant', 'serviceVariant')
            .leftJoin('service.categoryRelation', 'category')
            .where('appointment.startTime BETWEEN :from AND :to', { from, to })
            .andWhere('appointment.status = :status', {
                status: AppointmentStatus.Completed,
            })
            .select('service.id', 'serviceId')
            .addSelect('service.name', 'serviceName')
            .addSelect('category.name', 'categoryName')
            .addSelect('COUNT(*)', 'bookingCount')
            .addSelect(
                'SUM(COALESCE(appointment.paidAmount, serviceVariant.price, service.price))',
                'revenue',
            )
            .addSelect(
                'AVG(COALESCE(appointment.paidAmount, serviceVariant.price, service.price))',
                'averagePrice',
            )
            .addSelect(
                'AVG(COALESCE(serviceVariant.duration, service.duration))',
                'averageDuration',
            )
            .groupBy('service.id')
            .addGroupBy('service.name')
            .addGroupBy('category.name')
            .orderBy('bookingCount', 'DESC')
            .getRawMany();

        return result.map((r) => ({
            serviceId: r.serviceId,
            serviceName: r.serviceName,
            categoryName: r.categoryName,
            bookingCount: parseInt(r.bookingCount, 10),
            revenue: parseFloat(r.revenue) || 0,
            averagePrice: parseFloat(r.averagePrice) || 0,
            averageDuration: parseFloat(r.averageDuration) || 0,
        }));
    }

    async getCustomerStats(from: Date, to: Date): Promise<CustomerStats> {
        // New clients in period
        const newCustomers = await this.userRepository.count({
            where: {
                role: Role.Customer,
                createdAt: Between(from, to),
            },
        });

        // Unique clients who had appointments
        const clientsWithAppointments = await this.appointmentRepository
            .createQueryBuilder('appointment')
            .where('appointment.startTime BETWEEN :from AND :to', { from, to })
            .andWhere('appointment.status = :status', {
                status: AppointmentStatus.Completed,
            })
            .select('DISTINCT appointment.customerId')
            .getRawMany();

        const totalVisits = await this.appointmentRepository.count({
            where: {
                startTime: Between(from, to),
                status: AppointmentStatus.Completed,
            },
        });

        // Top clients
        const topClientsResult = await this.appointmentRepository
            .createQueryBuilder('appointment')
            .innerJoin('appointment.client', 'client')
            .leftJoin('appointment.service', 'service')
            .leftJoin('appointment.serviceVariant', 'serviceVariant')
            .where('appointment.startTime BETWEEN :from AND :to', { from, to })
            .andWhere('appointment.status = :status', {
                status: AppointmentStatus.Completed,
            })
            .select('client.id', 'customerId')
            .addSelect('client.name', 'customerName')
            .addSelect('COUNT(*)', 'visits')
            .addSelect(
                'SUM(COALESCE(appointment.paidAmount, serviceVariant.price, service.price, 0))',
                'totalSpent',
            )
            .groupBy('client.id')
            .addGroupBy('client.name')
            .orderBy('visits', 'DESC')
            .limit(10)
            .getRawMany();

        return {
            newCustomers,
            returningCustomers: clientsWithAppointments.length,
            totalVisits,
            averageVisitsPerCustomer:
                clientsWithAppointments.length > 0
                    ? totalVisits / clientsWithAppointments.length
                    : 0,
            topClients: topClientsResult.map((r) => ({
                customerId: r.customerId,
                customerName: r.customerName,
                visits: parseInt(r.visits, 10),
                totalSpent: parseFloat(r.totalSpent) || 0,
            })),
        };
    }

    async getCashRegister(date: Date): Promise<CashRegisterSummary> {
        const dayStart = startOfDay(date);
        const dayEnd = endOfDay(date);

        const appointments = await this.appointmentRepository.find({
            where: {
                finalizedAt: Between(dayStart, dayEnd),
                status: AppointmentStatus.Completed,
            },
            relations: ['service', 'serviceVariant', 'employee', 'client'],
            order: { finalizedAt: 'ASC' },
        });

        const entries: CashRegisterEntry[] = appointments.map((a) => ({
            id: a.id,
            time: format(new Date(a.finalizedAt!), 'HH:mm'),
            type: 'appointment' as const,
            description: a.service?.name ?? 'Wizyta',
            paymentMethod: a.paymentMethod ?? 'cash',
            amount: this.resolveAppointmentPrice(a),
            tip: a.tipAmount ?? 0,
            employeeName: a.employee?.name ?? null,
            customerName: a.client?.name ?? null,
        }));

        const totals = {
            cash: 0,
            card: 0,
            transfer: 0,
            online: 0,
            voucher: 0,
            total: 0,
            tips: 0,
        };

        for (const entry of entries) {
            const method = entry.paymentMethod as keyof typeof totals;
            if (method in totals) {
                totals[method] += entry.amount;
            }
            totals.total += entry.amount;
            totals.tips += entry.tip;
        }

        return {
            date: format(date, 'yyyy-MM-dd'),
            entries,
            totals,
        };
    }

    async getTipsSummary(from: Date, to: Date): Promise<TipsSummary[]> {
        const result = await this.appointmentRepository
            .createQueryBuilder('appointment')
            .innerJoin('appointment.employee', 'employee')
            .where('appointment.startTime BETWEEN :from AND :to', { from, to })
            .andWhere('appointment.status = :status', {
                status: AppointmentStatus.Completed,
            })
            .andWhere('appointment.tipAmount > 0')
            .select('employee.id', 'employeeId')
            .addSelect('employee.name', 'employeeName')
            .addSelect('COUNT(*)', 'tipsCount')
            .addSelect('SUM(appointment.tipAmount)', 'tipsTotal')
            .addSelect('AVG(appointment.tipAmount)', 'averageTip')
            .groupBy('employee.id')
            .addGroupBy('employee.name')
            .orderBy('tipsTotal', 'DESC')
            .getRawMany();

        return result.map((r) => ({
            employeeId: r.employeeId,
            employeeName: r.employeeName,
            tipsCount: parseInt(r.tipsCount, 10),
            tipsTotal: parseFloat(r.tipsTotal) || 0,
            averageTip: parseFloat(r.averageTip) || 0,
        }));
    }

    async getEmployeeActivity(date: Date): Promise<EmployeeActivitySummary> {
        const dayStart = startOfDay(date);
        const dayEnd = endOfDay(date);

        const [employees, appointments] = await Promise.all([
            this.userRepository.find({
                where: { role: Role.Employee },
            }),
            this.appointmentRepository.find({
                where: {
                    startTime: Between(dayStart, dayEnd),
                    status: AppointmentStatus.Completed,
                },
                select: {
                    id: true,
                    employeeId: true,
                    startTime: true,
                    endTime: true,
                },
            }),
        ]);

        const activityByEmployee = new Map<
            number,
            { workTimeMinutes: number; appointmentsCount: number }
        >();
        for (const appointment of appointments) {
            const durationMs =
                new Date(appointment.endTime).getTime() -
                new Date(appointment.startTime).getTime();
            const durationMinutes = Math.max(
                0,
                Math.round(durationMs / (60 * 1000)),
            );
            const current = activityByEmployee.get(appointment.employeeId) ?? {
                workTimeMinutes: 0,
                appointmentsCount: 0,
            };
            current.workTimeMinutes += durationMinutes;
            current.appointmentsCount += 1;
            activityByEmployee.set(appointment.employeeId, current);
        }

        const employeesActivity: EmployeeActivity[] = [];
        let totalWorkTime = 0;
        let totalAppointments = 0;

        for (const employee of employees) {
            const activity = activityByEmployee.get(employee.id);
            const workTimeMinutes = activity?.workTimeMinutes ?? 0;
            const appointmentsCount = activity?.appointmentsCount ?? 0;

            employeesActivity.push({
                employeeId: employee.id,
                employeeName: employee.name,
                workTimeMinutes: Math.round(workTimeMinutes),
                appointmentsCount,
            });

            totalWorkTime += workTimeMinutes;
            totalAppointments += appointmentsCount;
        }

        return {
            date: format(date, 'yyyy-MM-dd'),
            employees: employeesActivity,
            totals: {
                workTimeMinutes: Math.round(totalWorkTime),
                appointmentsCount: totalAppointments,
            },
        };
    }

    private resolveAppointmentPrice(appointment: Appointment): number {
        return this.parseMoney(
            appointment.paidAmount ??
                appointment.serviceVariant?.price ??
                appointment.service?.price ??
                0,
        );
    }

    private parseMoney(value: unknown): number {
        if (typeof value === 'number') {
            return Number.isFinite(value) ? value : 0;
        }
        if (typeof value !== 'string') {
            const numeric = Number(value);
            return Number.isFinite(numeric) ? numeric : 0;
        }

        const raw = value.trim();
        if (!raw) return 0;

        const normalized = raw.replace(',', '.');
        const repeatedMoney = normalized.match(/-?\d+\.\d{2}/g);
        if (repeatedMoney && repeatedMoney.length > 1) {
            const sum = repeatedMoney.reduce((acc, token) => {
                const amount = Number(token);
                return acc + (Number.isFinite(amount) ? amount : 0);
            }, 0);
            return Number.isFinite(sum) ? sum : 0;
        }

        const amount =
            Number(normalized.replace(/[^0-9.-]/g, '')) ||
            Number((normalized.match(/-?\d+(?:\.\d+)?/) || ['0'])[0]);
        return Number.isFinite(amount) ? amount : 0;
    }

    async getCommissionReport(
        from: Date,
        to: Date,
    ): Promise<CommissionReportSummary> {
        const employees = await this.userRepository.find({
            where: { role: Role.Employee },
        });

        const [
            appointments,
            serviceCommissionRows,
            productSalesRows,
            productCommissionRows,
        ] = await Promise.all([
            this.appointmentRepository.find({
                where: {
                    startTime: Between(from, to),
                    status: AppointmentStatus.Completed,
                },
                relations: ['service', 'serviceVariant'],
            }),
            this.appointmentRepository.query(
                `SELECT c."employeeId" AS "employeeId",
                            COALESCE(SUM(c.amount), 0) AS amount
                     FROM commissions c
                     INNER JOIN appointments a ON a.id = c."appointmentId"
                     WHERE a."startTime" BETWEEN $1 AND $2
                     GROUP BY c."employeeId"`,
                [from, to],
            ),
            this.hasTable('public.product_sales').then(async (exists) => {
                if (!exists) return [];
                return this.appointmentRepository.query(
                    `SELECT COALESCE("employeeId", 0) AS "employeeId",
                                COALESCE(SUM(quantity * "unitPrice" - COALESCE(discount, 0)), 0) AS revenue
                         FROM product_sales
                         WHERE "soldAt" BETWEEN $1 AND $2
                         GROUP BY COALESCE("employeeId", 0)`,
                    [from, to],
                );
            }),
            this.hasTable('public.product_sales').then(async (exists) => {
                if (!exists) return [];
                return this.appointmentRepository.query(
                    `SELECT COALESCE(ps."employeeId", 0) AS "employeeId",
                                COALESCE(SUM(c.amount), 0) AS amount
                         FROM commissions c
                         INNER JOIN product_sales ps ON ps.id = c."productSaleId"
                         WHERE ps."soldAt" BETWEEN $1 AND $2
                         GROUP BY COALESCE(ps."employeeId", 0)`,
                    [from, to],
                );
            }),
        ]);

        const serviceRevenueByEmployee = new Map<number, number>();
        for (const appointment of appointments) {
            const key = appointment.employeeId;
            serviceRevenueByEmployee.set(
                key,
                (serviceRevenueByEmployee.get(key) ?? 0) +
                    this.resolveAppointmentPrice(appointment),
            );
        }

        const serviceCommissionByEmployee = new Map<number, number>();
        for (const row of serviceCommissionRows) {
            const key = Number(
                (row as { employeeId: string | number }).employeeId ?? 0,
            );
            if (!key) continue;
            serviceCommissionByEmployee.set(
                key,
                Number((row as { amount: string | number }).amount ?? 0),
            );
        }

        const productRevenueByEmployee = new Map<number, number>(
            productSalesRows.map(
                (row: {
                    employeeId: string | number;
                    revenue: string | number;
                }) => [
                    Number(
                        row.employeeId ??
                            StatisticsService.RECEPTION_EMPLOYEE_ID,
                    ),
                    Number(row.revenue ?? 0),
                ],
            ),
        );

        const productCommissionByEmployee = new Map<number, number>(
            productCommissionRows.map(
                (row: {
                    employeeId: string | number;
                    amount: string | number;
                }) => [
                    Number(
                        row.employeeId ??
                            StatisticsService.RECEPTION_EMPLOYEE_ID,
                    ),
                    Number(row.amount ?? 0),
                ],
            ),
        );

        const employeesReport: CommissionReport[] = [];
        let totalServiceRevenue = 0;
        let totalServiceCommission = 0;
        let totalProductRevenue = 0;
        let totalProductCommission = 0;

        const employeeRows = [...employees];
        if (
            productRevenueByEmployee.has(
                StatisticsService.RECEPTION_EMPLOYEE_ID,
            ) ||
            productCommissionByEmployee.has(
                StatisticsService.RECEPTION_EMPLOYEE_ID,
            )
        ) {
            employeeRows.unshift({
                id: StatisticsService.RECEPTION_EMPLOYEE_ID,
                name: StatisticsService.RECEPTION_EMPLOYEE_NAME,
            } as User);
        }

        for (const employee of employeeRows) {
            const employeeKey =
                employee.id ?? StatisticsService.RECEPTION_EMPLOYEE_ID;
            const serviceRevenue =
                serviceRevenueByEmployee.get(employeeKey) ?? 0;
            const serviceCommission =
                serviceCommissionByEmployee.get(employeeKey) ?? 0;
            const productRevenue =
                productRevenueByEmployee.get(employeeKey) ?? 0;
            const productCommission =
                productCommissionByEmployee.get(employeeKey) ?? 0;
            const totalRevenue = serviceRevenue + productRevenue;
            const totalCommission = serviceCommission + productCommission;

            employeesReport.push({
                employeeId: employeeKey,
                employeeName:
                    employee.name ?? StatisticsService.RECEPTION_EMPLOYEE_NAME,
                serviceRevenue,
                serviceCommission,
                productRevenue,
                productCommission,
                totalRevenue,
                totalCommission,
            });

            totalServiceRevenue += serviceRevenue;
            totalServiceCommission += serviceCommission;
            totalProductRevenue += productRevenue;
            totalProductCommission += productCommission;
        }

        return {
            date: format(from, 'yyyy-MM-dd'),
            employees: employeesReport,
            totals: {
                serviceRevenue: totalServiceRevenue,
                serviceCommission: totalServiceCommission,
                productRevenue: totalProductRevenue,
                productCommission: totalProductCommission,
                totalRevenue: totalServiceRevenue + totalProductRevenue,
                totalCommission:
                    totalServiceCommission + totalProductCommission,
            },
        };
    }

    private async hasTable(name: string): Promise<boolean> {
        try {
            const [result] = await this.appointmentRepository.query(
                'SELECT to_regclass($1) AS exists',
                [name],
            );
            return Boolean(result?.exists);
        } catch {
            return false;
        }
    }

    async getCustomerReturningStats(
        from: Date,
        to: Date,
    ): Promise<CustomerReturningStats> {
        // Get all clients who had appointments in the period
        const appointments = await this.appointmentRepository
            .createQueryBuilder('appointment')
            .innerJoin('appointment.client', 'client')
            .where('appointment.startTime BETWEEN :from AND :to', { from, to })
            .andWhere('appointment.status = :status', {
                status: AppointmentStatus.Completed,
            })
            .select('client.id', 'customerId')
            .addSelect('MIN(appointment.startTime)', 'firstVisit')
            .addSelect('COUNT(*)', 'visitCount')
            .groupBy('client.id')
            .getRawMany();

        // Get clients who had appointments BEFORE this period (returning)
        const customerIds = appointments.map((a) => a.customerId);
        const returningCustomersList =
            customerIds.length > 0
                ? await this.appointmentRepository
                      .createQueryBuilder('appointment')
                      .where('appointment.customerId IN (:...customerIds)', {
                          customerIds,
                      })
                      .andWhere('appointment.startTime < :from', { from })
                      .andWhere('appointment.status = :status', {
                          status: AppointmentStatus.Completed,
                      })
                      .select('DISTINCT appointment.customerId', 'customerId')
                      .getRawMany()
                : [];

        const returningClientIds = new Set(
            returningCustomersList.map((r) => r.customerId),
        );

        const totalCustomers = appointments.length;
        const returningCustomers = appointments.filter((a) =>
            returningClientIds.has(a.customerId),
        ).length;
        const newCustomers = totalCustomers - returningCustomers;

        // Monthly breakdown
        const monthlyData = await this.appointmentRepository
            .createQueryBuilder('appointment')
            .innerJoin('appointment.client', 'client')
            .where('appointment.startTime BETWEEN :from AND :to', { from, to })
            .andWhere('appointment.status = :status', {
                status: AppointmentStatus.Completed,
            })
            .select("DATE_TRUNC('month', appointment.startTime)", 'month')
            .addSelect('client.id', 'customerId')
            .addSelect('MIN(appointment.startTime)', 'firstVisitInPeriod')
            .groupBy("DATE_TRUNC('month', appointment.startTime)")
            .addGroupBy('client.id')
            .orderBy('month', 'ASC')
            .getRawMany();

        // Group by month and calculate new/returning
        const monthMap = new Map<
            string,
            { newCustomers: number; returningCustomers: number }
        >();

        for (const row of monthlyData) {
            const monthKey = format(new Date(row.month), 'yyyy-MM');
            const customerId = row.customerId;

            if (!monthMap.has(monthKey)) {
                monthMap.set(monthKey, { newCustomers: 0, returningCustomers: 0 });
            }

            const monthStats = monthMap.get(monthKey)!;

            // Check if client had visits before this period
            const hadPreviousVisits = returningClientIds.has(customerId);

            if (hadPreviousVisits) {
                monthStats.returningCustomers++;
            } else {
                monthStats.newCustomers++;
            }
        }

        const byMonth = Array.from(monthMap.entries()).map(
            ([month, stats]) => ({
                month,
                newCustomers: stats.newCustomers,
                returningCustomers: stats.returningCustomers,
            }),
        );

        return {
            totalCustomers,
            returningCustomers,
            returningPercentage:
                totalCustomers > 0
                    ? Math.round((returningCustomers / totalCustomers) * 100)
                    : 0,
            newCustomers,
            newPercentage:
                totalCustomers > 0
                    ? Math.round((newCustomers / totalCustomers) * 100)
                    : 0,
            byMonth,
        };
    }

    async getCustomerOriginStats(
        from: Date,
        to: Date,
    ): Promise<CustomerOriginStats> {
        // Get new clients in period with their origin/source
        const clients = await this.userRepository
            .createQueryBuilder('user')
            .where('user.role = :role', { role: Role.Customer })
            .andWhere('user.createdAt BETWEEN :from AND :to', { from, to })
            .select('user.id', 'id')
            .addSelect('user.source', 'source')
            .getRawMany();

        // Count by source
        const sourceCounts = new Map<string, number>();
        let total = 0;

        for (const client of clients) {
            const source = client.source || 'Nieznane';
            sourceCounts.set(source, (sourceCounts.get(source) || 0) + 1);
            total++;
        }

        const origins = Array.from(sourceCounts.entries())
            .map(([origin, count]) => ({
                origin,
                count,
                percentage: total > 0 ? Math.round((count / total) * 100) : 0,
            }))
            .sort((a, b) => b.count - a.count);

        return {
            totalCustomers: total,
            origins,
        };
    }

    async getWarehouseMovementStats(
        from: Date,
        to: Date,
    ): Promise<WarehouseMovementStats> {
        // Get movements in period
        const movements = await this.productMovementRepository.find({
            where: {
                createdAt: Between(from, to),
            },
            relations: ['product', 'createdBy'],
            order: { createdAt: 'DESC' },
        });

        // Group by type
        const typeMap = new Map<
            string,
            { count: number; quantityChange: number }
        >();

        for (const m of movements) {
            const type = m.movementType;
            if (!typeMap.has(type)) {
                typeMap.set(type, { count: 0, quantityChange: 0 });
            }
            const stats = typeMap.get(type)!;
            stats.count++;
            stats.quantityChange += m.quantity;
        }

        const byType = Array.from(typeMap.entries()).map(([type, stats]) => ({
            type,
            count: stats.count,
            quantityChange: stats.quantityChange,
        }));

        const recentMovements = movements.slice(0, 50).map((m) => ({
            id: m.id,
            productName: m.product?.name || 'Produkt',
            type: m.movementType,
            quantity: m.quantity,
            quantityBefore: m.quantityBefore,
            quantityAfter: m.quantityAfter,
            createdAt: m.createdAt.toISOString(),
            createdByName: m.createdBy?.name || null,
        }));

        return {
            totalMovements: movements.length,
            byType,
            recentMovements,
        };
    }

    async getWarehouseValueStats(): Promise<WarehouseValueStats> {
        // Get all products with quantities
        const products = await this.productRepository.find({
            relations: ['category'],
        });

        let totalValue = 0;
        let totalQuantity = 0;
        const categoryMap = new Map<
            string,
            {
                productCount: number;
                totalValue: number;
                totalQuantity: number;
            }
        >();

        const lowStockProducts: WarehouseValueStats['lowStockProducts'] = [];

        for (const p of products) {
            const quantity = p.stock || 0;
            const price = Number(p.purchasePrice || p.unitPrice || 0);
            const value = quantity * price;

            totalValue += value;
            totalQuantity += quantity;

            const category = p.category?.name || 'Bez kategorii';
            if (!categoryMap.has(category)) {
                categoryMap.set(category, {
                    productCount: 0,
                    totalValue: 0,
                    totalQuantity: 0,
                });
            }
            const catStats = categoryMap.get(category)!;
            catStats.productCount++;
            catStats.totalValue += value;
            catStats.totalQuantity += quantity;

            // Check low stock
            const minQty = p.minQuantity || 5;
            if (quantity <= minQty) {
                lowStockProducts.push({
                    id: p.id,
                    name: p.name,
                    quantity,
                    minQuantity: minQty,
                    price: Number(p.unitPrice || 0),
                });
            }
        }

        const byCategory = Array.from(categoryMap.entries())
            .map(([category, stats]) => ({
                category,
                productCount: stats.productCount,
                totalValue: stats.totalValue,
                totalQuantity: stats.totalQuantity,
            }))
            .sort((a, b) => b.totalValue - a.totalValue);

        return {
            totalProducts: products.length,
            totalValue,
            totalQuantity,
            byCategory,
            lowStockProducts: lowStockProducts.slice(0, 20),
        };
    }

    async getWorkTimeReport(from: Date, to: Date): Promise<WorkTimeReport[]> {
        const employees = await this.userRepository.find({
            where: { role: Role.Employee },
        });

        const employeeIds = employees.map((employee) => employee.id);
        const timetables =
            employeeIds.length > 0
                ? await this.timetableRepository.find({
                      where: {
                          employeeId: In(employeeIds),
                          isActive: true,
                      },
                      relations: ['slots', 'exceptions'],
                  })
                : [];
        const timetableByEmployeeId = new Map<number, Timetable>();
        for (const timetable of timetables) {
            if (!timetableByEmployeeId.has(timetable.employeeId)) {
                timetableByEmployeeId.set(timetable.employeeId, timetable);
            }
        }

        const reports: WorkTimeReport[] = [];

        for (const employee of employees) {
            const timetable = timetableByEmployeeId.get(employee.id);

            // Calculate work time for each day in range
            const byDay: WorkTimeReport['byDay'] = [];
            let totalWorkTimeMinutes = 0;
            let totalAppointments = 0;
            let workingDays = 0;

            // Iterate through each day in the range
            const days = eachDayOfInterval({ start: from, end: to });

            for (const day of days) {
                const dayStart = startOfDay(day);
                const dayEnd = endOfDay(day);
                const dayOfWeek = day.getDay();
                const sourceDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek;

                let workTimeMinutes = 0;

                if (timetable) {
                    // Check for exceptions first
                    const exception = timetable.exceptions?.find((e) => {
                        const exDate = new Date(e.date);
                        return exDate >= dayStart && exDate <= dayEnd;
                    });

                    if (exception) {
                        if (
                            exception.type !== ExceptionType.DayOff &&
                            exception.customStartTime &&
                            exception.customEndTime
                        ) {
                            const [startHour, startMin] =
                                exception.customStartTime
                                    .split(':')
                                    .map(Number);
                            const [endHour, endMin] = exception.customEndTime
                                .split(':')
                                .map(Number);
                            workTimeMinutes =
                                endHour * 60 +
                                endMin -
                                (startHour * 60 + startMin);
                        }
                    } else {
                        // Use regular slot
                        const targetDayOfWeek = (sourceDayOfWeek -
                            1) as DayOfWeek;
                        const slot = timetable.slots?.find(
                            (s) => s.dayOfWeek === targetDayOfWeek,
                        );

                        if (slot) {
                            const [startHour, startMin] = slot.startTime
                                .split(':')
                                .map(Number);
                            const [endHour, endMin] = slot.endTime
                                .split(':')
                                .map(Number);
                            workTimeMinutes =
                                endHour * 60 +
                                endMin -
                                (startHour * 60 + startMin);
                        }
                    }
                }

                // Count appointments for this day
                const appointments = await this.appointmentRepository.count({
                    where: {
                        employeeId: employee.id,
                        startTime: Between(dayStart, dayEnd),
                        status: AppointmentStatus.Completed,
                    },
                });

                if (workTimeMinutes > 0) {
                    workingDays++;
                    totalWorkTimeMinutes += workTimeMinutes;
                }
                totalAppointments += appointments;

                byDay.push({
                    date: format(day, 'yyyy-MM-dd'),
                    workTimeMinutes: Math.round(workTimeMinutes),
                    appointmentsCount: appointments,
                });
            }

            reports.push({
                employeeId: employee.id,
                employeeName: employee.name,
                totalWorkTimeMinutes: Math.round(totalWorkTimeMinutes),
                totalAppointments,
                workingDays,
                averageWorkTimePerDay:
                    workingDays > 0
                        ? Math.round(totalWorkTimeMinutes / workingDays)
                        : 0,
                byDay,
            });
        }

        // Sort by total work time descending
        return reports.sort(
            (a, b) => b.totalWorkTimeMinutes - a.totalWorkTimeMinutes,
        );
    }

    // Helper method to resolve date range
    resolveDateRange(
        range: DateRange,
        customFrom?: Date,
        customTo?: Date,
    ): { from: Date; to: Date } {
        const now = new Date();

        switch (range) {
            case DateRange.Today:
                return { from: startOfDay(now), to: endOfDay(now) };
            case DateRange.Yesterday: {
                const yesterday = subDays(now, 1);
                return { from: startOfDay(yesterday), to: endOfDay(yesterday) };
            }
            case DateRange.ThisWeek:
                return {
                    from: startOfWeek(now, { weekStartsOn: 1 }),
                    to: endOfDay(now),
                };
            case DateRange.LastWeek: {
                const lastWeek = subWeeks(now, 1);
                return {
                    from: startOfWeek(lastWeek, { weekStartsOn: 1 }),
                    to: endOfWeek(lastWeek, { weekStartsOn: 1 }),
                };
            }
            case DateRange.ThisMonth:
                return { from: startOfMonth(now), to: endOfDay(now) };
            case DateRange.LastMonth: {
                const lastMonth = subMonths(now, 1);
                return {
                    from: startOfMonth(lastMonth),
                    to: endOfMonth(lastMonth),
                };
            }
            case DateRange.ThisYear:
                return { from: startOfYear(now), to: endOfDay(now) };
            case DateRange.Custom:
                if (customFrom && customTo) {
                    return {
                        from: startOfDay(customFrom),
                        to: endOfDay(customTo),
                    };
                }
                // If custom range without dates, use default (this month)
                return { from: startOfMonth(now), to: endOfDay(now) };
            default:
                return { from: startOfMonth(now), to: endOfDay(now) };
        }
    }
}
