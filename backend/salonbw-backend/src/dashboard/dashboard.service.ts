import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan, In } from 'typeorm';
import { User } from '../users/user.entity';
import { Role } from '../users/role.enum';
import {
    Appointment,
    AppointmentStatus,
} from '../appointments/appointment.entity';
import { DashboardSummaryDto } from './dto/dashboard-summary.dto';
import { ClientDashboardDto } from './dto/client-dashboard.dto';

@Injectable()
export class DashboardService {
    constructor(
        @InjectRepository(User)
        private readonly usersRepository: Repository<User>,
        @InjectRepository(Appointment)
        private readonly appointmentsRepository: Repository<Appointment>,
    ) {}

    async getSummary(): Promise<DashboardSummaryDto> {
        const [clientCount, employeeCount] = await Promise.all([
            this.usersRepository.count({ where: { role: Role.Client } }),
            this.usersRepository.count({ where: { role: Role.Employee } }),
        ]);

        const now = new Date();
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(now);
        endOfDay.setHours(23, 59, 59, 999);

        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const activeStatuses = [
            AppointmentStatus.Scheduled,
            AppointmentStatus.Confirmed,
            AppointmentStatus.InProgress,
            AppointmentStatus.OnlinePending,
        ];

        // Run all DB queries in parallel
        const [
            todayActive,
            onlinePending,
            upcomingAppointments,
            completedToday,
            completedThisMonth,
        ] = await Promise.all([
            this.appointmentsRepository.count({
                where: {
                    startTime: Between(startOfDay, endOfDay),
                    status: In(activeStatuses),
                },
            }),
            this.appointmentsRepository.count({
                where: { status: AppointmentStatus.OnlinePending },
            }),
            this.appointmentsRepository.find({
                where: {
                    startTime: MoreThan(now),
                    status: In([
                        AppointmentStatus.Scheduled,
                        AppointmentStatus.Confirmed,
                        AppointmentStatus.OnlinePending,
                    ]),
                },
                relations: ['client', 'service', 'employee'],
                order: { startTime: 'ASC' },
                take: 8,
            }),
            this.appointmentsRepository.find({
                where: {
                    startTime: Between(startOfDay, endOfDay),
                    status: AppointmentStatus.Completed,
                },
                select: ['id', 'paidAmount'],
            }),
            this.appointmentsRepository.find({
                where: {
                    startTime: Between(startOfMonth, endOfDay),
                    status: AppointmentStatus.Completed,
                },
                select: ['id', 'paidAmount'],
            }),
        ]);

        const revenueToday = completedToday.reduce(
            (sum, a) => sum + (Number(a.paidAmount) || 0),
            0,
        );
        const revenueThisMonth = completedThisMonth.reduce(
            (sum, a) => sum + (Number(a.paidAmount) || 0),
            0,
        );

        return {
            clientCount,
            employeeCount,
            todayAppointments: todayActive,
            onlinePendingCount: onlinePending,
            revenueToday,
            revenueThisMonth,
            completedThisMonth: completedThisMonth.length,
            upcomingAppointments: upcomingAppointments.map((a) => ({
                id: a.id,
                startTime: a.startTime,
                endTime: a.endTime,
                status: a.status,
                clientName: a.client?.name ?? '',
                clientPhone: (a.client as any)?.phone ?? '',
                serviceName: a.service?.name ?? '',
                employeeName: a.employee?.name ?? '',
            })),
        };
    }

    async getClientSummary(userId: number): Promise<ClientDashboardDto> {
        const now = new Date();

        const upcomingAppointment = await this.appointmentsRepository.findOne({
            where: {
                client: { id: userId },
                startTime: MoreThan(now),
                status: In([
                    AppointmentStatus.Scheduled,
                    AppointmentStatus.Confirmed,
                    AppointmentStatus.RescheduledPending,
                    AppointmentStatus.OnlinePending,
                ]),
            },
            relations: ['service', 'employee'],
            order: { startTime: 'ASC' },
        });

        const [completedCount, allAppointments, recentAppointments] =
            await Promise.all([
                this.appointmentsRepository.count({
                    where: {
                        client: { id: userId },
                        status: AppointmentStatus.Completed,
                    },
                }),
                this.appointmentsRepository.find({
                    where: { client: { id: userId } },
                    relations: ['service'],
                }),
                this.appointmentsRepository.find({
                    where: { client: { id: userId } },
                    relations: ['service', 'employee'],
                    order: { startTime: 'DESC' },
                    take: 10,
                }),
            ]);

        const serviceMap = new Map<
            number,
            { id: number; name: string; count: number }
        >();
        for (const apt of allAppointments) {
            if (apt.service) {
                const existing = serviceMap.get(apt.service.id);
                if (existing) {
                    existing.count++;
                } else {
                    serviceMap.set(apt.service.id, {
                        id: apt.service.id,
                        name: apt.service.name,
                        count: 1,
                    });
                }
            }
        }
        const serviceHistory = Array.from(serviceMap.values()).sort(
            (a, b) => b.count - a.count,
        );

        return {
            upcomingAppointment: upcomingAppointment
                ? {
                      id: upcomingAppointment.id,
                      serviceName: upcomingAppointment.service?.name ?? '',
                      startTime: upcomingAppointment.startTime,
                      status: upcomingAppointment.status,
                      employeeName:
                          upcomingAppointment.employee?.name ??
                          upcomingAppointment.employee?.email ??
                          '',
                  }
                : null,
            completedCount,
            serviceHistory,
            recentAppointments: recentAppointments.map((apt) => ({
                id: apt.id,
                serviceName: apt.service?.name ?? '',
                startTime: apt.startTime,
                status: apt.status,
                employeeName:
                    apt.employee?.name ?? apt.employee?.email ?? undefined,
            })),
        };
    }
}
