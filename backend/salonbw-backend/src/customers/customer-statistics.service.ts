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

    private parseRange(options?: { from?: string; to?: string }) {
        const fromRaw = (options?.from || '').trim();
        const toRaw = (options?.to || '').trim();
        const parseYmd = (value: string) => {
            if (!value) return null;
            // Expect YYYY-MM-DD
            const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
            if (!match) return null;
            const y = Number(match[1]);
            const m = Number(match[2]);
            const d = Number(match[3]);
            if (
                !Number.isInteger(y) ||
                !Number.isInteger(m) ||
                !Number.isInteger(d)
            ) {
                return null;
            }
            const dt = new Date(y, m - 1, d);
            return Number.isFinite(dt.getTime()) ? dt : null;
        };

        const from = parseYmd(fromRaw);
        const to = parseYmd(toRaw);
        // Interpret "to" as inclusive day; we use < (to + 1 day)
        const toExclusive =
            to !== null
                ? new Date(to.getFullYear(), to.getMonth(), to.getDate() + 1)
                : null;
        return { from, toExclusive };
    }

    async getStatistics(
        customerId: number,
        options?: { from?: string; to?: string },
    ): Promise<CustomerStatistics> {
        const { from, toExclusive } = this.parseRange(options);

        const qb = this.appointmentsRepo
            .createQueryBuilder('apt')
            .leftJoinAndSelect('apt.service', 'service')
            .leftJoinAndSelect('apt.employee', 'employee')
            .where('apt.clientId = :customerId', { customerId })
            .orderBy('apt.startTime', 'ASC');

        if (from) {
            qb.andWhere('apt.startTime >= :from', { from });
        }
        if (toExclusive) {
            qb.andWhere('apt.startTime < :to', { to: toExclusive });
        }

        const appointments = await qb.getMany();

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

        // Visits by month (up to last 12 points in range)
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
        options?: {
            limit?: number;
            offset?: number;
            from?: string;
            to?: string;
            status?: string; // comma-separated list of statuses
            withCounts?: boolean;
        },
    ) {
        const { limit = 20, offset = 0 } = options || {};
        const { from, toExclusive } = this.parseRange(options);

        const allowed = new Set<string>(Object.values(AppointmentStatus));
        const statuses =
            options?.status
                ?.split(',')
                .map((s) => s.trim())
                .filter((s) => s.length > 0 && allowed.has(s)) ?? [];

        const qb = this.appointmentsRepo
            .createQueryBuilder('apt')
            .leftJoinAndSelect('apt.service', 'service')
            .leftJoinAndSelect('apt.employee', 'employee')
            .where('apt.clientId = :customerId', { customerId })
            .orderBy('apt.startTime', 'DESC')
            .take(limit)
            .skip(offset);

        if (from) {
            qb.andWhere('apt.startTime >= :from', { from });
        }
        if (toExclusive) {
            qb.andWhere('apt.startTime < :to', { to: toExclusive });
        }
        if (statuses.length > 0) {
            qb.andWhere('apt.status IN (:...statuses)', { statuses });
        }

        const [appointments, total] = await qb.getManyAndCount();

        const counts = options?.withCounts
            ? await (async () => {
                  const countQb = this.appointmentsRepo
                      .createQueryBuilder('apt')
                      .select('apt.status', 'status')
                      .addSelect('COUNT(*)', 'count')
                      .where('apt.clientId = :customerId', { customerId })
                      .groupBy('apt.status');
                  if (from) {
                      countQb.andWhere('apt.startTime >= :from', { from });
                  }
                  if (toExclusive) {
                      countQb.andWhere('apt.startTime < :to', {
                          to: toExclusive,
                      });
                  }
                  const rows = await countQb.getRawMany<{
                      status: AppointmentStatus;
                      count: string;
                  }>();

                  const byStatus = new Map<string, number>();
                  for (const row of rows) {
                      const n = Number(row.count);
                      byStatus.set(row.status, Number.isFinite(n) ? n : 0);
                  }

                  const all = Array.from(byStatus.values()).reduce(
                      (sum, n) => sum + n,
                      0,
                  );
                  const upcoming =
                      (byStatus.get(AppointmentStatus.Scheduled) ?? 0) +
                      (byStatus.get(AppointmentStatus.Confirmed) ?? 0) +
                      (byStatus.get(AppointmentStatus.InProgress) ?? 0);
                  const completed =
                      byStatus.get(AppointmentStatus.Completed) ?? 0;
                  const cancelled =
                      byStatus.get(AppointmentStatus.Cancelled) ?? 0;
                  const noShow = byStatus.get(AppointmentStatus.NoShow) ?? 0;

                  return {
                      all,
                      upcoming,
                      completed,
                      cancelled,
                      no_show: noShow,
                  };
              })()
            : undefined;

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
            ...(counts ? { counts } : {}),
            total,
            limit,
            offset,
        };
    }
}
