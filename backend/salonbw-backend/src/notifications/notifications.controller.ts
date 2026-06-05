import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
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

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class NotificationsController {
    constructor(
        @InjectRepository(Appointment)
        private readonly appointments: Repository<Appointment>,
    ) {}

    @Get()
    @Roles(Role.Admin, Role.Employee, Role.Receptionist, Role.Client)
    @ApiOperation({ summary: 'Get in-app notification feed for current user' })
    async getNotifications(
        @CurrentUser() user: { userId: number; role: Role },
    ) {
        const isClient = user.role === Role.Client;
        const now = new Date();
        const since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        if (isClient) {
            const upcoming = await this.appointments.find({
                where: {
                    client: { id: user.userId },
                    status: In([
                        AppointmentStatus.Scheduled,
                        AppointmentStatus.Confirmed,
                        AppointmentStatus.OnlinePending,
                    ]),
                },
                relations: ['service', 'employee'],
                order: { startTime: 'ASC' },
                take: 10,
            });
            return upcoming.map((a) => ({
                id: a.id,
                message: this.formatClientMessage(a),
                createdAt: a.startTime,
            }));
        }

        const pending = await this.appointments.find({
            where: { status: AppointmentStatus.OnlinePending },
            relations: ['client', 'service'],
            order: { startTime: 'ASC' },
            take: 20,
        });

        const recent = await this.appointments
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

        const pendingNotifs = pending.map((a) => ({
            id: a.id * 1000,
            message: `Nowa rezerwacja online od ${a.client?.name ?? 'klienta'} — ${a.service?.name ?? 'usługa'} (${this.formatTime(a.startTime)}) czeka na potwierdzenie`,
            createdAt: a.createdAt ?? a.startTime,
        }));

        const todayNotifs = recent.map((a) => ({
            id: a.id,
            message: `Wizyta: ${a.client?.name ?? 'klient'} — ${a.service?.name ?? 'usługa'} o ${this.formatTime(a.startTime)}`,
            createdAt: a.startTime,
        }));

        return [...pendingNotifs, ...todayNotifs].slice(0, 20);
    }

    private formatClientMessage(a: Appointment): string {
        const timeStr = this.formatTime(a.startTime);
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
