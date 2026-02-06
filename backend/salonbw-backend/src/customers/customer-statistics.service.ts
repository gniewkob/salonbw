import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
    Appointment,
    AppointmentStatus,
} from '../appointments/appointment.entity';
import { User } from '../users/user.entity';

export interface CustomerStatistics {
    totalVisits: number;
    completedVisits: number;
    cancelledVisits: number;
    noShowVisits: number;
    totalSpent: number;
    averageSpent: number;
    lastVisitDate: Date | null;
    firstVisitDate: Date | null;
    favoriteServices: Array<{
        serviceId: number;
        serviceName: string;
        count: number;
    }>;
    favoriteEmployees: Array<{
        employeeId: number;
        employeeName: string;
        count: number;
    }>;
    visitsByMonth: Array<{
        month: string;
        count: number;
        spent: number;
    }>;
}

@Injectable()
export class CustomerStatisticsService {
    constructor(
        @InjectRepository(Appointment)
        private readonly appointmentsRepo: Repository<Appointment>,
        @InjectRepository(User)
        private readonly usersRepo: Repository<User>,
    ) {}

    async getStatistics(customerId: number): Promise<CustomerStatistics> {
        const appointments = await this.appointmentsRepo.find({
            where: { client: { id: customerId } },
            relations: ['service', 'employee'],
            order: { startTime: 'ASC' },
        });

        const completed = appointments.filter(
            (a) => a.status === AppointmentStatus.Completed,
        );
        const cancelled = appointments.filter(
            (a) => a.status === AppointmentStatus.Cancelled,
        );
        const noShow = appointments.filter(
            (a) => a.status === AppointmentStatus.NoShow,
        );

        const totalSpent = completed.reduce(
            (sum, a) => sum + (a.paidAmount || a.service?.price || 0),
            0,
        );

        // Favorite services
        const serviceCount = new Map<number, { name: string; count: number }>();
        completed.forEach((a) => {
            if (a.service) {
                const existing = serviceCount.get(a.service.id);
                if (existing) {
                    existing.count++;
                } else {
                    serviceCount.set(a.service.id, {
                        name: a.service.name,
                        count: 1,
                    });
                }
            }
        });
        const favoriteServices = Array.from(serviceCount.entries())
            .map(([serviceId, data]) => ({
                serviceId,
                serviceName: data.name,
                count: data.count,
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        // Favorite employees
        const employeeCount = new Map<
            number,
            { name: string; count: number }
        >();
        completed.forEach((a) => {
            if (a.employee) {
                const existing = employeeCount.get(a.employee.id);
                if (existing) {
                    existing.count++;
                } else {
                    employeeCount.set(a.employee.id, {
                        name: a.employee.name,
                        count: 1,
                    });
                }
            }
        });
        const favoriteEmployees = Array.from(employeeCount.entries())
            .map(([employeeId, data]) => ({
                employeeId,
                employeeName: data.name,
                count: data.count,
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        // Visits by month (last 12 months)
        const monthlyData = new Map<string, { count: number; spent: number }>();
        completed.forEach((a) => {
            const date = new Date(a.startTime);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const existing = monthlyData.get(monthKey);
            const spent = a.paidAmount || a.service?.price || 0;
            if (existing) {
                existing.count++;
                existing.spent += spent;
            } else {
                monthlyData.set(monthKey, { count: 1, spent });
            }
        });
        const visitsByMonth = Array.from(monthlyData.entries())
            .map(([month, data]) => ({
                month,
                count: data.count,
                spent: data.spent,
            }))
            .sort((a, b) => a.month.localeCompare(b.month))
            .slice(-12);

        return {
            totalVisits: appointments.length,
            completedVisits: completed.length,
            cancelledVisits: cancelled.length,
            noShowVisits: noShow.length,
            totalSpent,
            averageSpent:
                completed.length > 0 ? totalSpent / completed.length : 0,
            lastVisitDate:
                completed.length > 0
                    ? new Date(completed[completed.length - 1].startTime)
                    : null,
            firstVisitDate:
                completed.length > 0 ? new Date(completed[0].startTime) : null,
            favoriteServices,
            favoriteEmployees,
            visitsByMonth,
        };
    }

    async getEventHistory(
        customerId: number,
        options?: { limit?: number; offset?: number },
    ) {
        const { limit = 20, offset = 0 } = options || {};

        const [appointments, total] = await this.appointmentsRepo.findAndCount({
            where: { client: { id: customerId } },
            relations: ['service', 'employee'],
            order: { startTime: 'DESC' },
            take: limit,
            skip: offset,
        });

        return {
            items: appointments.map((a) => ({
                id: a.id,
                date: a.startTime.toISOString().split('T')[0],
                time: a.startTime.toLocaleTimeString('pl-PL', {
                    hour: '2-digit',
                    minute: '2-digit',
                }),
                service: a.service
                    ? { id: a.service.id, name: a.service.name }
                    : null,
                employee: a.employee
                    ? { id: a.employee.id, name: a.employee.name }
                    : null,
                status: a.status,
                price: a.paidAmount || a.service?.price || 0,
            })),
            total,
            limit,
            offset,
        };
    }
}
