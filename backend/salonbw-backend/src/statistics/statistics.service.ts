import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
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
import { TimetableException } from '../timetables/entities/timetable-exception.entity';
import {
    DateRange,
    GroupBy,
    DashboardStats,
    RevenueDataPoint,
    EmployeeStats,
    EmployeeActivity,
    EmployeeActivitySummary,
    ServiceStats,
    ClientStats,
    ClientReturningStats,
    ClientOriginStats,
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

        // Today stats
        const todayAppointments = await this.appointmentRepository.find({
            where: {
                startTime: Between(todayStart, todayEnd),
            },
            relations: ['service', 'serviceVariant'],
        });

        const todayCompleted = todayAppointments.filter(
            (a) => a.status === 'completed',
        );

        const todayRevenue = todayCompleted.reduce(
            (sum, a) => sum + this.resolveAppointmentPrice(a),
            0,
        );

        // New clients today
        const todayNewClients = await this.userRepository.count({
            where: {
                role: Role.Client,
                createdAt: Between(todayStart, todayEnd),
            },
        });

        // Week stats
        const weekAppointments = await this.appointmentRepository.find({
            where: {
                startTime: Between(weekStart, todayEnd),
                status: AppointmentStatus.Completed,
            },
            relations: ['service', 'serviceVariant'],
        });

        const weekRevenue = weekAppointments.reduce(
            (sum, a) => sum + this.resolveAppointmentPrice(a),
            0,
        );

        // Month stats
        const monthAppointments = await this.appointmentRepository.find({
            where: {
                startTime: Between(monthStart, todayEnd),
                status: AppointmentStatus.Completed,
            },
            relations: ['service', 'serviceVariant'],
        });

        const monthRevenue = monthAppointments.reduce(
            (sum, a) => sum + this.resolveAppointmentPrice(a),
            0,
        );

        // Pending appointments
        const pendingAppointments = await this.appointmentRepository.count({
            where: {
                startTime: MoreThanOrEqual(now),
                status: AppointmentStatus.Scheduled,
            },
        });

        // Average rating
        const ratingResult = await this.reviewRepository
            .createQueryBuilder('review')
            .select('AVG(review.rating)', 'avg')
            .getRawOne();

        return {
            todayRevenue,
            todayAppointments: todayAppointments.length,
            todayCompletedAppointments: todayCompleted.length,
            todayNewClients,
            weekRevenue,
            weekAppointments: weekAppointments.length,
            monthRevenue,
            monthAppointments: monthAppointments.length,
            pendingAppointments,
            averageRating: parseFloat(ratingResult?.avg ?? '0') || 0,
        };
    }

    async getRevenueChart(
        from: Date,
        to: Date,
        groupBy: GroupBy = GroupBy.Day,
        employeeId?: number,
    ): Promise<RevenueDataPoint[]> {
        const whereClause: Record<string, unknown> = {
            startTime: Between(from, to),
            status: AppointmentStatus.Completed,
        };

        if (employeeId) {
            whereClause.employeeId = employeeId;
        }

        const appointments = await this.appointmentRepository.find({
            where: whereClause,
            relations: ['service', 'serviceVariant'],
        });

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
                (sum, a) => sum + this.resolveAppointmentPrice(a),
                0,
            );
            const tips = periodAppointments.reduce(
                (sum, a) => sum + (a.tipAmount ?? 0),
                0,
            );

            return {
                date: format(date, 'yyyy-MM-dd'),
                label: format(date, formatStr, { locale: pl }),
                revenue,
                appointments: periodAppointments.length,
                tips,
                products: 0, // TODO: Add product sales when retail integration is complete
            };
        });

        return dataPoints;
    }

    async getEmployeeRanking(from: Date, to: Date): Promise<EmployeeStats[]> {
        const employees = await this.userRepository.find({
            where: { role: Role.Employee },
        });

        const stats: EmployeeStats[] = [];

        for (const employee of employees) {
            const appointments = await this.appointmentRepository.find({
                where: {
                    employee: { id: employee.id },
                    startTime: Between(from, to),
                    status: AppointmentStatus.Completed,
                },
                relations: ['service', 'serviceVariant'],
            });

            const revenue = appointments.reduce(
                (sum, a) => sum + this.resolveAppointmentPrice(a),
                0,
            );
            const tips = appointments.reduce(
                (sum, a) => sum + (a.tipAmount ?? 0),
                0,
            );
            const totalDuration = appointments.reduce(
                (sum, a) =>
                    sum +
                    (a.serviceVariant?.duration ?? a.service?.duration ?? 0),
                0,
            );

            // Get reviews
            const reviewsResult = await this.reviewRepository
                .createQueryBuilder('review')
                .innerJoin('review.appointment', 'appointment')
                .where('appointment.employeeId = :employeeId', {
                    employeeId: employee.id,
                })
                .andWhere('appointment.startTime BETWEEN :from AND :to', {
                    from,
                    to,
                })
                .select('AVG(review.rating)', 'avg')
                .addSelect('COUNT(*)', 'count')
                .getRawOne();

            stats.push({
                employeeId: employee.id,
                employeeName: employee.name,
                revenue,
                appointments: appointments.length,
                completedAppointments: appointments.length,
                averageDuration:
                    appointments.length > 0
                        ? totalDuration / appointments.length
                        : 0,
                averageRevenue:
                    appointments.length > 0 ? revenue / appointments.length : 0,
                tips,
                rating: parseFloat(reviewsResult?.avg ?? '0') || 0,
                reviewCount: parseInt(reviewsResult?.count ?? '0', 10),
            });
        }

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

    async getClientStats(from: Date, to: Date): Promise<ClientStats> {
        // New clients in period
        const newClients = await this.userRepository.count({
            where: {
                role: Role.Client,
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
            .select('DISTINCT appointment.clientId')
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
            .select('client.id', 'clientId')
            .addSelect('client.name', 'clientName')
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
            newClients,
            returningClients: clientsWithAppointments.length,
            totalVisits,
            averageVisitsPerClient:
                clientsWithAppointments.length > 0
                    ? totalVisits / clientsWithAppointments.length
                    : 0,
            topClients: topClientsResult.map((r) => ({
                clientId: r.clientId,
                clientName: r.clientName,
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
            clientName: a.client?.name ?? null,
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
        const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const dayOfWeekVersum = dayOfWeek === 0 ? 7 : dayOfWeek; // Versum uses 1-7 (Mon-Sun)

        const employees = await this.userRepository.find({
            where: { role: Role.Employee },
        });

        const employeesActivity: EmployeeActivity[] = [];
        let totalWorkTime = 0;
        let totalAppointments = 0;

        for (const employee of employees) {
            // Get timetable for employee
            const timetable = await this.timetableRepository.findOne({
                where: {
                    employeeId: employee.id,
                    isActive: true,
                    validFrom: LessThanOrEqual(date),
                },
                relations: ['slots', 'exceptions'],
                order: { validFrom: 'DESC' },
            });

            // Calculate work time from timetable
            let workTimeMinutes = 0;

            if (timetable) {
                // Check for exceptions first
                const exception = timetable.exceptions?.find(
                    (e) =>
                        new Date(e.date) >= dayStart &&
                        new Date(e.date) <= dayEnd,
                );

                if (exception) {
                    // Use exception hours - check if it's not a day off
                    if (
                        exception.type !== 'day_off' &&
                        exception.customStartTime &&
                        exception.customEndTime
                    ) {
                        // Parse time strings (HH:mm:ss)
                        const [startHour, startMin] = exception.customStartTime
                            .split(':')
                            .map(Number);
                        const [endHour, endMin] = exception.customEndTime
                            .split(':')
                            .map(Number);
                        workTimeMinutes =
                            endHour * 60 + endMin - (startHour * 60 + startMin);
                    }
                } else {
                    // Use regular slot for this day
                    // Versum uses 1-7 (Mon-Sun), our DayOfWeek uses 0-6 (Mon-Sun)
                    const slot = timetable.slots?.find(
                        (s) => s.dayOfWeek === dayOfWeekVersum - 1,
                    );

                    if (slot) {
                        // Parse time strings (HH:mm:ss)
                        const [startHour, startMin] = slot.startTime
                            .split(':')
                            .map(Number);
                        const [endHour, endMin] = slot.endTime
                            .split(':')
                            .map(Number);
                        workTimeMinutes =
                            endHour * 60 + endMin - (startHour * 60 + startMin);
                    }
                }
            }

            // Count appointments for this employee on this date
            const appointments = await this.appointmentRepository.count({
                where: {
                    employeeId: employee.id,
                    startTime: Between(dayStart, dayEnd),
                    status: AppointmentStatus.Completed,
                },
            });

            employeesActivity.push({
                employeeId: employee.id,
                employeeName: employee.name,
                workTimeMinutes: Math.round(workTimeMinutes),
                appointmentsCount: appointments,
            });

            totalWorkTime += workTimeMinutes;
            totalAppointments += appointments;
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
        return (
            appointment.paidAmount ??
            Number(
                appointment.serviceVariant?.price ??
                    appointment.service?.price ??
                    0,
            )
        );
    }

    async getCommissionReport(
        from: Date,
        to: Date,
    ): Promise<CommissionReportSummary> {
        const employees = await this.userRepository.find({
            where: { role: Role.Employee },
        });

        const employeesReport: CommissionReport[] = [];
        let totalServiceRevenue = 0;
        let totalServiceCommission = 0;
        let totalProductRevenue = 0;
        let totalProductCommission = 0;

        for (const employee of employees) {
            // Get completed appointments for employee in date range
            const appointments = await this.appointmentRepository.find({
                where: {
                    employee: { id: employee.id },
                    startTime: Between(from, to),
                    status: AppointmentStatus.Completed,
                },
                relations: ['service', 'serviceVariant'],
            });

            const serviceRevenue = appointments.reduce(
                (sum, a) => sum + this.resolveAppointmentPrice(a),
                0,
            );

            // Get commissions for employee in date range
            const commissions = await this.commissionRepository
                .createQueryBuilder('commission')
                .where('commission.employeeId = :employeeId', {
                    employeeId: employee.id,
                })
                .andWhere('commission.createdAt BETWEEN :from AND :to', {
                    from,
                    to,
                })
                .getMany();

            const serviceCommission = commissions.reduce(
                (sum, c) => sum + Number(c.amount),
                0,
            );

            // TODO: Product sales - when retail module is ready
            const productRevenue = 0;
            const productCommission = 0;

            const totalRevenue = serviceRevenue + productRevenue;
            const totalCommission = serviceCommission + productCommission;

            employeesReport.push({
                employeeId: employee.id,
                employeeName: employee.name,
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

    async getClientReturningStats(
        from: Date,
        to: Date,
    ): Promise<ClientReturningStats> {
        // Get all clients who had appointments in the period
        const appointments = await this.appointmentRepository
            .createQueryBuilder('appointment')
            .innerJoin('appointment.client', 'client')
            .where('appointment.startTime BETWEEN :from AND :to', { from, to })
            .andWhere('appointment.status = :status', {
                status: AppointmentStatus.Completed,
            })
            .select('client.id', 'clientId')
            .addSelect('MIN(appointment.startTime)', 'firstVisit')
            .addSelect('COUNT(*)', 'visitCount')
            .groupBy('client.id')
            .getRawMany();

        // Get clients who had appointments BEFORE this period (returning)
        const clientIds = appointments.map((a) => a.clientId);
        const returningClientsList =
            clientIds.length > 0
                ? await this.appointmentRepository
                      .createQueryBuilder('appointment')
                      .where('appointment.clientId IN (:...clientIds)', {
                          clientIds,
                      })
                      .andWhere('appointment.startTime < :from', { from })
                      .andWhere('appointment.status = :status', {
                          status: AppointmentStatus.Completed,
                      })
                      .select('DISTINCT appointment.clientId', 'clientId')
                      .getRawMany()
                : [];

        const returningClientIds = new Set(
            returningClientsList.map((r) => r.clientId),
        );

        const totalClients = appointments.length;
        const returningClients = appointments.filter((a) =>
            returningClientIds.has(a.clientId),
        ).length;
        const newClients = totalClients - returningClients;

        // Monthly breakdown
        const monthlyData = await this.appointmentRepository
            .createQueryBuilder('appointment')
            .innerJoin('appointment.client', 'client')
            .where('appointment.startTime BETWEEN :from AND :to', { from, to })
            .andWhere('appointment.status = :status', {
                status: AppointmentStatus.Completed,
            })
            .select("DATE_TRUNC('month', appointment.startTime)", 'month')
            .addSelect('client.id', 'clientId')
            .addSelect('MIN(appointment.startTime)', 'firstVisitInPeriod')
            .groupBy("DATE_TRUNC('month', appointment.startTime)")
            .addGroupBy('client.id')
            .orderBy('month', 'ASC')
            .getRawMany();

        // Group by month and calculate new/returning
        const monthMap = new Map<
            string,
            { newClients: number; returningClients: number }
        >();

        for (const row of monthlyData) {
            const monthKey = format(new Date(row.month), 'yyyy-MM');
            const clientId = row.clientId;

            if (!monthMap.has(monthKey)) {
                monthMap.set(monthKey, { newClients: 0, returningClients: 0 });
            }

            const monthStats = monthMap.get(monthKey)!;

            // Check if client had visits before this period
            const hadPreviousVisits = returningClientIds.has(clientId);

            if (hadPreviousVisits) {
                monthStats.returningClients++;
            } else {
                monthStats.newClients++;
            }
        }

        const byMonth = Array.from(monthMap.entries()).map(
            ([month, stats]) => ({
                month,
                newClients: stats.newClients,
                returningClients: stats.returningClients,
            }),
        );

        return {
            totalClients,
            returningClients,
            returningPercentage:
                totalClients > 0
                    ? Math.round((returningClients / totalClients) * 100)
                    : 0,
            newClients,
            newPercentage:
                totalClients > 0
                    ? Math.round((newClients / totalClients) * 100)
                    : 0,
            byMonth,
        };
    }

    async getClientOriginStats(
        from: Date,
        to: Date,
    ): Promise<ClientOriginStats> {
        // Get new clients in period with their origin/source
        const clients = await this.userRepository
            .createQueryBuilder('user')
            .where('user.role = :role', { role: Role.Client })
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
            totalClients: total,
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

        const reports: WorkTimeReport[] = [];

        for (const employee of employees) {
            // Get timetable for employee
            const timetable = await this.timetableRepository.findOne({
                where: {
                    employeeId: employee.id,
                    isActive: true,
                },
                relations: ['slots', 'exceptions'],
            });

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
                const dayOfWeekVersum = dayOfWeek === 0 ? 7 : dayOfWeek;

                let workTimeMinutes = 0;

                if (timetable) {
                    // Check for exceptions first
                    const exception = timetable.exceptions?.find((e) => {
                        const exDate = new Date(e.date);
                        return exDate >= dayStart && exDate <= dayEnd;
                    });

                    if (exception) {
                        if (
                            exception.type !== 'day_off' &&
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
                        const slot = timetable.slots?.find(
                            (s) => s.dayOfWeek === dayOfWeekVersum - 1,
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
        customFrom?: string,
        customTo?: string,
    ): { from: Date; to: Date } {
        const now = new Date();

        switch (range) {
            case DateRange.Today:
                return { from: startOfDay(now), to: endOfDay(now) };
            case DateRange.Yesterday:
                const yesterday = subDays(now, 1);
                return { from: startOfDay(yesterday), to: endOfDay(yesterday) };
            case DateRange.ThisWeek:
                return {
                    from: startOfWeek(now, { weekStartsOn: 1 }),
                    to: endOfDay(now),
                };
            case DateRange.LastWeek:
                const lastWeek = subWeeks(now, 1);
                return {
                    from: startOfWeek(lastWeek, { weekStartsOn: 1 }),
                    to: endOfWeek(lastWeek, { weekStartsOn: 1 }),
                };
            case DateRange.ThisMonth:
                return { from: startOfMonth(now), to: endOfDay(now) };
            case DateRange.LastMonth:
                const lastMonth = subMonths(now, 1);
                return {
                    from: startOfMonth(lastMonth),
                    to: endOfMonth(lastMonth),
                };
            case DateRange.ThisYear:
                return { from: startOfYear(now), to: endOfDay(now) };
            case DateRange.Custom:
                if (customFrom && customTo) {
                    return {
                        from: startOfDay(new Date(customFrom)),
                        to: endOfDay(new Date(customTo)),
                    };
                }
                // If custom range without dates, use default (this month)
                return { from: startOfMonth(now), to: endOfDay(now) };
            default:
                return { from: startOfMonth(now), to: endOfDay(now) };
        }
    }
}
