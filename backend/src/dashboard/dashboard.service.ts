import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan, LessThan, Not } from 'typeorm';
import {
    Appointment,
    AppointmentStatus,
    PaymentStatus,
} from '../appointments/appointment.entity';
import { User } from '../users/user.entity';
import { Role } from '../users/role.enum';
import { EmployeeRole } from '../employees/employee-role.enum';
import { Review } from '../reviews/review.entity';
import { Notification } from '../notifications/notification.entity';
import { EmployeeCommission } from '../commissions/employee-commission.entity';
import { Product } from '../catalog/product.entity';
import { Log } from '../logs/log.entity';
import { LogAction } from '../logs/action.enum';

export interface ClientDashboard {
    fullName: string;
    email: string;
    upcomingAppointments: number;
    nextAppointments: Appointment[];
    lastReview: Review | null;
    notifications: number;
}

export interface EmployeeDashboard {
    fullName: string;
    email: string;
    todayAppointments: number;
    nextAppointments: Appointment[];
    unreadMessages: number;
    lastCommission: EmployeeCommission | null;
}

export interface AdminDashboard {
    fullName: string;
    email: string;
    todayAppointments: number;
    activeEmployees: number;
    newClientsLast7Days: number;
    nextAppointments: Appointment[];
    lowStockProducts: number;
    currentMonthPayments: number;
    unreadIssues: number;
}

export type DashboardSummary =
    | ClientDashboard
    | EmployeeDashboard
    | AdminDashboard;

@Injectable()
export class DashboardService {
    constructor(
        @InjectRepository(User) private readonly users: Repository<User>,
        @InjectRepository(Appointment)
        private readonly appts: Repository<Appointment>,
        @InjectRepository(Review)
        private readonly reviews: Repository<Review>,
        @InjectRepository(Notification)
        private readonly notificationsRepo: Repository<Notification>,
        @InjectRepository(EmployeeCommission)
        private readonly commissions: Repository<EmployeeCommission>,
        @InjectRepository(Product)
        private readonly products: Repository<Product>,
        @InjectRepository(Log)
        private readonly logs: Repository<Log>,
    ) {}

    async getSummary(
        userId: number,
        role: Role | EmployeeRole,
    ): Promise<DashboardSummary> {
        const user = await this.users.findOne({ where: { id: userId } });
        const base = {
            fullName: `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim(),
            email: user?.email ?? '',
        };
        const now = new Date();
        const startOfDay = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
        );
        const endOfDay = new Date(startOfDay);
        endOfDay.setDate(endOfDay.getDate() + 1);

        if (role === Role.Client) {
            const upcomingAppointments = await this.appts.count({
                where: {
                    client: { id: userId } as any,
                    startTime: MoreThan(now),
                    status: AppointmentStatus.Scheduled,
                },
            });
            const nextAppointments = await this.appts.find({
                where: {
                    client: { id: userId } as any,
                    startTime: MoreThan(now),
                    status: AppointmentStatus.Scheduled,
                },
                order: { startTime: 'ASC' },
                take: 3,
                relations: { service: true, employee: true },
            });
            const lastReview = await this.reviews.findOne({
                where: { client: { id: userId } as any },
                order: { createdAt: 'DESC' },
            });
            const where: any[] = [];
            if (user?.phone) where.push({ recipient: user.phone });
            if (user?.email) where.push({ recipient: user.email });
            const notifications = where.length
                ? await this.notificationsRepo.count({ where })
                : 0;
            return {
                ...base,
                upcomingAppointments,
                nextAppointments,
                lastReview: lastReview ?? null,
                notifications,
            } as ClientDashboard;
        }

        if (role === Role.Admin) {
            const todayAppointments = await this.appts.count({
                where: {
                    startTime: Between(startOfDay, endOfDay),
                    status: AppointmentStatus.Scheduled,
                },
            });
            const activeEmployees = await this.users.count({
                where: { role: Not(Role.Client) as any },
            });
            const start7 = new Date();
            start7.setDate(start7.getDate() - 7);
            const newClientsLast7Days = await this.logs.count({
                where: {
                    action: LogAction.RegisterSuccess,
                    timestamp: MoreThan(start7),
                },
            });
            const nextAppointments = await this.appts.find({
                where: {
                    startTime: MoreThan(now),
                    status: AppointmentStatus.Scheduled,
                },
                order: { startTime: 'ASC' },
                take: 3,
                relations: { service: true, employee: true, client: true },
            });
            const lowStockProducts = await this.products.count({
                where: { stock: LessThan(5) },
            });
            const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endMonth = new Date(startMonth);
            endMonth.setMonth(endMonth.getMonth() + 1);
            const result = await this.appts
                .createQueryBuilder('a')
                .leftJoin('a.service', 's')
                .select('SUM(s.price)', 'sum')
                .where('a.paymentStatus = :status', {
                    status: PaymentStatus.Paid,
                })
                .andWhere('a.startTime >= :start AND a.startTime < :end', {
                    start: startMonth,
                    end: endMonth,
                })
                .getRawOne();
            const currentMonthPayments = Number(result?.sum ?? 0);
            return {
                ...base,
                todayAppointments,
                activeEmployees,
                newClientsLast7Days,
                nextAppointments,
                lowStockProducts,
                currentMonthPayments,
                unreadIssues: 0,
            } as AdminDashboard;
        }

        // employee
        const todayAppointments = await this.appts.count({
            where: {
                employee: { id: userId } as any,
                startTime: Between(startOfDay, endOfDay),
                status: AppointmentStatus.Scheduled,
            },
        });
        const nextAppointments = await this.appts.find({
            where: {
                employee: { id: userId } as any,
                startTime: MoreThan(now),
                status: AppointmentStatus.Scheduled,
            },
            order: { startTime: 'ASC' },
            take: 3,
            relations: { client: true, service: true },
        });
        const lastCommission = await this.commissions.findOne({
            where: { employee: { id: userId } as any },
            order: { createdAt: 'DESC' },
        });
        return {
            ...base,
            todayAppointments,
            nextAppointments,
            unreadMessages: 0,
            lastCommission: lastCommission ?? null,
        } as EmployeeDashboard;
    }
}
