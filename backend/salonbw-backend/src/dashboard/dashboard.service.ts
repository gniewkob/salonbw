import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan, In } from 'typeorm';
import { User } from '../users/user.entity';
import { Role } from '../users/role.enum';
import {
    Appointment,
    AppointmentStatus,
} from '../appointments/appointment.entity';
import { AppointmentMessage } from '../appointments/appointment-message.entity';
import { Review } from '../reviews/review.entity';
import { DashboardSummaryDto } from './dto/dashboard-summary.dto';
import { ClientDashboardDto } from './dto/client-dashboard.dto';
import { ClientVisitDto } from './dto/client-visits.dto';

@Injectable()
export class DashboardService {
    constructor(
        @InjectRepository(User)
        private readonly usersRepository: Repository<User>,
        @InjectRepository(Appointment)
        private readonly appointmentsRepository: Repository<Appointment>,
        @InjectRepository(AppointmentMessage)
        private readonly appointmentMessagesRepository: Repository<AppointmentMessage>,
        @InjectRepository(Review)
        private readonly reviewsRepository: Repository<Review>,
    ) {}

    /**
     * Full visit history for the client's "Moje wizyty" view — explicit
     * client-safe mapping (no money fields, no internalNote), newest first,
     * with the client's own review stitched onto each visit.
     */
    async getClientVisits(userId: number): Promise<ClientVisitDto[]> {
        const [appointments, reviews] = await Promise.all([
            this.appointmentsRepository.find({
                where: { client: { id: userId } },
                relations: ['service', 'employee'],
                order: { startTime: 'DESC' },
            }),
            this.reviewsRepository.find({
                where: { client: { id: userId } },
                relations: ['appointment'],
            }),
        ]);

        const reviewByAppointment = new Map<
            number,
            { id: number; rating: number; comment: string | null }
        >();
        for (const review of reviews) {
            if (review.appointment) {
                reviewByAppointment.set(review.appointment.id, {
                    id: review.id,
                    rating: review.rating,
                    comment: review.comment ?? null,
                });
            }
        }

        return appointments.map((apt) => ({
            id: apt.id,
            startTime: apt.startTime,
            endTime: apt.endTime,
            reschedulePreviousStartTime:
                apt.reschedulePreviousStartTime ?? null,
            reschedulePreviousEndTime: apt.reschedulePreviousEndTime ?? null,
            status: apt.status,
            serviceId: apt.service?.id ?? 0,
            serviceName: apt.service?.name ?? '',
            employeeName: apt.employee?.name ?? apt.employee?.email ?? '',
            notes: apt.notes ?? null,
            clientComment: apt.clientComment ?? null,
            staffRecommendations: apt.staffRecommendations ?? null,
            onlineAddonsSummary: apt.onlineAddonsSummary ?? null,
            onlineTotalDurationMinutes: apt.onlineTotalDurationMinutes ?? null,
            onlineDurationNeedsVerification:
                apt.onlineDurationNeedsVerification ?? false,
            review: reviewByAppointment.get(apt.id) ?? null,
        }));
    }

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
            inProgressAppointments,
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
                where: { status: AppointmentStatus.InProgress },
                relations: ['client', 'service', 'employee'],
                order: { startTime: 'ASC' },
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

        const mapAppointment = (a: Appointment) => ({
            id: a.id,
            startTime: a.startTime,
            endTime: a.endTime,
            status: a.status,
            clientName: a.client?.name ?? '',
            clientPhone: (a.client as any)?.phone ?? '',
            serviceName: a.service?.name ?? '',
            employeeName: a.employee?.name ?? '',
        });

        return {
            clientCount,
            employeeCount,
            todayAppointments: todayActive,
            onlinePendingCount: onlinePending,
            revenueToday,
            revenueThisMonth,
            completedThisMonth: completedThisMonth.length,
            upcomingAppointments: upcomingAppointments.map(mapAppointment),
            inProgressAppointments: inProgressAppointments.map(mapAppointment),
        };
    }

    /**
     * "You have something waiting" banner signals for the client dashboard:
     * appointments where the salon proposed a new time (needs acceptance)
     * and threads where the salon wrote last (client hasn't replied).
     */
    private async getClientActionSignals(userId: number): Promise<{
        pendingRescheduleCount: number;
        newSalonMessageCount: number;
    }> {
        const [pendingRescheduleCount, newSalonMessageCount] =
            await Promise.all([
                this.appointmentsRepository.count({
                    where: {
                        client: { id: userId },
                        status: AppointmentStatus.RescheduledPending,
                    },
                }),
                this.appointmentMessagesRepository
                    .createQueryBuilder('m')
                    .innerJoin(Appointment, 'a', 'a.id = m.appointmentId')
                    .where('a.clientId = :userId', { userId })
                    .andWhere('a.status NOT IN (:...done)', {
                        done: [
                            AppointmentStatus.Cancelled,
                            AppointmentStatus.NoShow,
                        ],
                    })
                    .andWhere((qb) => {
                        const sub = qb
                            .subQuery()
                            .select('MAX(m2.createdAt)')
                            .from(AppointmentMessage, 'm2')
                            .where('m2.appointmentId = m.appointmentId')
                            .getQuery();
                        return `m.createdAt = ${sub}`;
                    })
                    .andWhere("m.authorRole <> 'client'")
                    .getCount(),
            ]);
        return { pendingRescheduleCount, newSalonMessageCount };
    }

    async getClientSummary(userId: number): Promise<ClientDashboardDto> {
        const now = new Date();

        const mapUpcomingAppointment = (apt: Appointment) => ({
            id: apt.id,
            serviceId: apt.service?.id ?? 0,
            serviceName: apt.service?.name ?? '',
            startTime: apt.startTime,
            reschedulePreviousStartTime:
                apt.reschedulePreviousStartTime ?? null,
            reschedulePreviousEndTime: apt.reschedulePreviousEndTime ?? null,
            status: apt.status,
            employeeName: apt.employee?.name ?? apt.employee?.email ?? '',
        });

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

        const pendingRescheduleAppointment =
            await this.appointmentsRepository.findOne({
                where: {
                    client: { id: userId },
                    status: AppointmentStatus.RescheduledPending,
                },
                relations: ['service', 'employee'],
                order: { startTime: 'ASC' },
            });

        const actionSignals = await this.getClientActionSignals(userId);

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
                ? mapUpcomingAppointment(upcomingAppointment)
                : null,
            pendingRescheduleAppointment: pendingRescheduleAppointment
                ? mapUpcomingAppointment(pendingRescheduleAppointment)
                : null,
            completedCount,
            serviceHistory,
            recentAppointments: recentAppointments.map((apt) => ({
                id: apt.id,
                serviceId: apt.service?.id ?? 0,
                serviceName: apt.service?.name ?? '',
                startTime: apt.startTime,
                reschedulePreviousStartTime:
                    apt.reschedulePreviousStartTime ?? null,
                reschedulePreviousEndTime:
                    apt.reschedulePreviousEndTime ?? null,
                status: apt.status,
                employeeName:
                    apt.employee?.name ?? apt.employee?.email ?? undefined,
                notes: apt.notes ?? null,
                clientComment: apt.clientComment ?? null,
                staffRecommendations: apt.staffRecommendations ?? null,
                onlineAddonsSummary: apt.onlineAddonsSummary ?? null,
                onlineTotalDurationMinutes:
                    apt.onlineTotalDurationMinutes ?? null,
                onlineDurationNeedsVerification:
                    apt.onlineDurationNeedsVerification ?? false,
            })),
            pendingRescheduleCount: actionSignals.pendingRescheduleCount,
            newSalonMessageCount: actionSignals.newSalonMessageCount,
        };
    }
}
