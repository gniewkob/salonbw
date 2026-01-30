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

    async getClientSummary(userId: number): Promise<ClientDashboardDto> {
        const now = new Date();

        // Get next upcoming appointment for this client
        const upcomingAppointment = await this.appointmentsRepository.findOne({
            where: {
                client: { id: userId },
                startTime: MoreThan(now),
                status: AppointmentStatus.Scheduled,
            },
            relations: ['service', 'employee'],
            order: { startTime: 'ASC' },
        });

        // Count completed appointments
        const completedCount = await this.appointmentsRepository.count({
            where: {
                client: { id: userId },
                status: AppointmentStatus.Completed,
            },
        });

        // Get all appointments for service history aggregation
        const allAppointments = await this.appointmentsRepository.find({
            where: {
                client: { id: userId },
            },
            relations: ['service'],
        });

        // Aggregate services used with counts
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

        // Get recent appointments (last 10)
        const recentAppointments = await this.appointmentsRepository.find({
            where: {
                client: { id: userId },
            },
            relations: ['service'],
            order: { startTime: 'DESC' },
            take: 10,
        });

        return {
            upcomingAppointment: upcomingAppointment
                ? {
                      id: upcomingAppointment.id,
                      serviceName: upcomingAppointment.service?.name ?? '',
                      startTime: upcomingAppointment.startTime,
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
            })),
        };
    }
}
