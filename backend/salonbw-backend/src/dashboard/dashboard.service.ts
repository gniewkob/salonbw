import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan } from 'typeorm';
import { User } from '../users/user.entity';
import { Role } from '../users/role.enum';
import {
    Appointment,
    AppointmentStatus,
} from '../appointments/appointment.entity';
import { DashboardSummaryDto } from './dto/dashboard-summary.dto';

@Injectable()
export class DashboardService {
    constructor(
        @InjectRepository(User)
        private readonly usersRepository: Repository<User>,
        @InjectRepository(Appointment)
        private readonly appointmentsRepository: Repository<Appointment>,
    ) {}

    async getSummary(): Promise<DashboardSummaryDto> {
        const clientCount = await this.usersRepository.count({
            where: { role: Role.Client },
        });
        const employeeCount = await this.usersRepository.count({
            where: { role: Role.Employee },
        });

        const now = new Date();
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(now);
        endOfDay.setHours(23, 59, 59, 999);

        const todayAppointments = await this.appointmentsRepository.count({
            where: {
                startTime: Between(startOfDay, endOfDay),
                status: AppointmentStatus.Scheduled,
            },
        });

        const upcomingAppointments = await this.appointmentsRepository.find({
            where: {
                startTime: MoreThan(now),
                status: AppointmentStatus.Scheduled,
            },
            order: { startTime: 'ASC' },
            take: 5,
        });

        return {
            clientCount,
            employeeCount,
            todayAppointments,
            upcomingAppointments,
        };
    }
}
