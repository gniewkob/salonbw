import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { Role } from '../users/role.enum';
import {
    Appointment,
    AppointmentStatus,
} from '../appointments/appointment.entity';
import { AppointmentMessage } from '../appointments/appointment-message.entity';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class NotificationsController {
    constructor(
        @InjectRepository(Appointment)
        private readonly appointments: Repository<Appointment>,
        @InjectRepository(AppointmentMessage)
        private readonly appointmentMessages: Repository<AppointmentMessage>,
    ) {}

    @Get('actionable-count')
    @SkipThrottle()
    @Roles(Role.Admin, Role.Employee, Role.Receptionist)
    @ApiOperation({ summary: 'Count actionable staff notifications' })
    async getActionableCount(
        @CurrentUser() user: { userId: number; role: Role },
    ): Promise<{ count: number }> {
        const pendingWhere =
            user.role === Role.Employee
                ? {
                      status: AppointmentStatus.OnlinePending,
                      employee: { id: user.userId },
                  }
                : { status: AppointmentStatus.OnlinePending };
        const [pendingBookings, clientMessageThreads] = await Promise.all([
            this.appointments.count({ where: pendingWhere }),
            this.buildActionableMessageQuery(user).getCount(),
        ]);
        return { count: pendingBookings + clientMessageThreads };
    }

    @Get()
    @Roles(Role.Admin, Role.Employee, Role.Receptionist, Role.Client)
    @ApiOperation({ summary: 'Get in-app notification feed for current user' })
    async getNotifications(
        @CurrentUser() user: { userId: number; role: Role },
    ) {
        const isClient = user.role === Role.Client;
        const now = new Date();
        const since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const messageNotificationsPromise = this.getMessageNotifications(user);

        if (isClient) {
            const [messageNotifications, upcoming] = await Promise.all([
                messageNotificationsPromise,
                this.appointments.find({
                    where: {
                        client: { id: user.userId },
                        status: In([
                            AppointmentStatus.Scheduled,
                            AppointmentStatus.Confirmed,
                            AppointmentStatus.OnlinePending,
                            AppointmentStatus.RescheduledPending,
                        ]),
                    },
                    relations: ['service', 'employee'],
                    order: { startTime: 'ASC' },
                    take: 10,
                }),
            ]);
            const appointmentNotifications = upcoming.map((a) => ({
                id: `client-${a.id}`,
                type:
                    a.status === AppointmentStatus.RescheduledPending
                        ? 'reschedule_action'
                        : 'appointment',
                appointmentId: a.id,
                message: this.formatClientMessage(a),
                createdAt: a.startTime,
                actionHref: `/visits?visitId=${a.id}`,
                actionLabel:
                    a.status === AppointmentStatus.RescheduledPending
                        ? 'Sprawdź i zaakceptuj'
                        : 'Szczegóły wizyty',
            }));
            return [...messageNotifications, ...appointmentNotifications].slice(
                0,
                20,
            );
        }

        const pendingPromise = this.appointments.find({
            where: { status: AppointmentStatus.OnlinePending },
            relations: ['client', 'service'],
            order: { startTime: 'ASC' },
            take: 20,
        });

        const recentPromise = this.appointments
            .createQueryBuilder('a')
            .leftJoinAndSelect('a.client', 'client')
            .leftJoinAndSelect('a.service', 'service')
            .where('a.status IN (:...statuses)', {
                statuses: [
                    AppointmentStatus.Scheduled,
                    AppointmentStatus.Confirmed,
                ],
            })
            .andWhere('a.startTime >= :since', { since })
            .andWhere('a.startTime <= :future', {
                future: new Date(now.getTime() + 24 * 60 * 60 * 1000),
            })
            .orderBy('a.startTime', 'ASC')
            .take(10)
            .getMany();

        const [messageNotifications, pending, recent] = await Promise.all([
            messageNotificationsPromise,
            pendingPromise,
            recentPromise,
        ]);

        const pendingNotifs = pending.map((a) => ({
            // Prefiks zamiast id*1000 — hack kolidował (#1 pending vs #1000 today).
            id: `pending-${a.id}`,
            type: 'online_booking_action',
            appointmentId: a.id,
            message: `Nowa rezerwacja online od ${a.client?.name ?? 'klienta'} — ${a.service?.name ?? 'usługa'} (${this.formatTime(a.startTime)}) czeka na potwierdzenie`,
            createdAt: a.createdAt ?? a.startTime,
            actionHref: `/calendar?appointmentId=${a.id}`,
            actionLabel: 'Otwórz wizytę',
        }));

        const todayNotifs = recent.map((a) => ({
            id: `today-${a.id}`,
            type: 'appointment',
            appointmentId: a.id,
            message: `Wizyta: ${a.client?.name ?? 'klient'} — ${a.service?.name ?? 'usługa'} o ${this.formatTime(a.startTime)}`,
            createdAt: a.startTime,
            actionHref: `/calendar?appointmentId=${a.id}`,
            actionLabel: 'Otwórz wizytę',
        }));

        return [
            ...messageNotifications,
            ...pendingNotifs,
            ...todayNotifs,
        ].slice(0, 20);
    }

    private async getMessageNotifications(user: {
        userId: number;
        role: Role;
    }) {
        const isClient = user.role === Role.Client;
        const messages = await this.buildActionableMessageQuery(user)
            .orderBy('message.createdAt', 'DESC')
            .addOrderBy('message.id', 'DESC')
            .take(10)
            .getMany();
        return messages.map((message) => ({
            id: `message-${message.id}`,
            type: 'appointment_message_action',
            appointmentId: message.appointmentId,
            message: isClient
                ? `Nowa wiadomość z salonu — ${message.appointment?.service?.name ?? 'wizyta'}`
                : `Nowa wiadomość od ${message.appointment?.client?.name ?? 'klientki'} — ${message.appointment?.service?.name ?? 'wizyta'}`,
            createdAt: message.createdAt,
            actionHref: isClient
                ? `/visits?visitId=${message.appointmentId}`
                : `/calendar?appointmentId=${message.appointmentId}`,
            actionLabel: 'Otwórz rozmowę',
        }));
    }

    private buildActionableMessageQuery(user: { userId: number; role: Role }) {
        const isClient = user.role === Role.Client;
        return this.appointmentMessages
            .createQueryBuilder('message')
            .innerJoinAndSelect('message.appointment', 'appointment')
            .leftJoinAndSelect('appointment.service', 'service')
            .leftJoinAndSelect('appointment.client', 'client')
            .where('appointment.status NOT IN (:...excludedStatuses)', {
                excludedStatuses: [
                    AppointmentStatus.Cancelled,
                    AppointmentStatus.NoShow,
                ],
            })
            .andWhere(
                isClient
                    ? 'appointment.clientId = :userId'
                    : "message.authorRole = 'client'",
                isClient ? { userId: user.userId } : {},
            )
            .andWhere(isClient ? "message.authorRole <> 'client'" : '1 = 1')
            .andWhere(`NOT EXISTS (
                SELECT 1 FROM "appointment_messages" newer
                WHERE newer."appointmentId" = message."appointmentId"
                  AND (
                    newer."createdAt" > message."createdAt"
                    OR (
                        newer."createdAt" = message."createdAt"
                        AND newer.id > message.id
                    )
                  )
            )`);
    }

    private formatClientMessage(a: Appointment): string {
        const timeStr = this.formatTime(a.startTime);
        if (a.status === AppointmentStatus.RescheduledPending) {
            return `Salon zaproponował nowy termin wizyty ${a.service?.name ?? 'usługa'} — ${timeStr}. Potwierdź zmianę.`;
        }
        if (a.status === AppointmentStatus.OnlinePending) {
            return `Twoja rezerwacja ${a.service?.name ?? ''} na ${timeStr} oczekuje na potwierdzenie`;
        }
        return `Wizyta: ${a.service?.name ?? 'usługa'} — ${timeStr}`;
    }

    private formatTime(date: Date | string): string {
        const d = new Date(date);
        return d.toLocaleString('pl-PL', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        });
    }
}
