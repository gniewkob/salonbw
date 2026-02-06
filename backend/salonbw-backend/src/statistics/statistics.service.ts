import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual } from 'typeorm';
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
import {
    DateRange,
    GroupBy,
    DashboardStats,
    RevenueDataPoint,
    EmployeeStats,
    ServiceStats,
    ClientStats,
    CashRegisterSummary,
    CashRegisterEntry,
    TipsSummary,
} from './dto/statistics.dto';
import { Role } from '../users/role.enum';

@Injectable()
export class StatisticsService {
    constructor(
        @InjectRepository(Appointment)
        private readonly appointmentRepository: Repository<Appointment>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Review)
        private readonly reviewRepository: Repository<Review>,
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
