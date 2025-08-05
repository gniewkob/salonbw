import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import {
    Appointment,
    PaymentStatus,
    AppointmentStatus,
} from '../appointments/appointment.entity';
import { Sale } from '../sales/sale.entity';
import { CommissionRecord } from '../commissions/commission-record.entity';
import { User } from '../users/user.entity';
import { Role } from '../users/role.enum';
import { Log } from '../logs/log.entity';
import { LogAction } from '../logs/action.enum';
import { Parser } from 'json2csv';

@Injectable()
export class ReportsService {
    constructor(
        @InjectRepository(Appointment)
        private readonly appointments: Repository<Appointment>,
        @InjectRepository(Sale)
        private readonly sales: Repository<Sale>,
        @InjectRepository(CommissionRecord)
        private readonly commissions: Repository<CommissionRecord>,
        @InjectRepository(User)
        private readonly users: Repository<User>,
        @InjectRepository(Log)
        private readonly logs: Repository<Log>,
    ) {}

    getFinancial(from?: string, to?: string) {
        const start = from ? new Date(from) : undefined;
        const end = to ? new Date(to) : undefined;
        return this.getFinancialSummary(start, end);
    }

    async getEmployeeReport(id: number, from?: string, to?: string) {
        const now = new Date();
        const start = from
            ? new Date(from)
            : new Date(now.getFullYear(), now.getMonth(), 1);
        const end = to
            ? new Date(to)
            : new Date(start.getFullYear(), start.getMonth() + 1, 1);

        const serviceResult = await this.appointments
            .createQueryBuilder('a')
            .leftJoin('a.service', 's')
            .select('SUM(s.price)', 'sum')
            .where('a.employeeId = :id', { id })
            .andWhere('a.paymentStatus = :status', {
                status: PaymentStatus.Paid,
            })
            .andWhere('a.startTime >= :start AND a.startTime < :end', {
                start,
                end,
            })
            .getRawOne();
        const serviceRevenue = Number(serviceResult?.sum ?? 0);

        const appointmentCountResult = await this.appointments
            .createQueryBuilder('a')
            .select('COUNT(*)', 'count')
            .where('a.employeeId = :id', { id })
            .andWhere('a.status = :status', {
                status: AppointmentStatus.Completed,
            })
            .andWhere('a.startTime >= :start AND a.startTime < :end', {
                start,
                end,
            })
            .getRawOne();
        const completedAppointments = Number(
            appointmentCountResult?.count ?? 0,
        );

        const productResult = await this.sales
            .createQueryBuilder('sale')
            .leftJoin('sale.product', 'p')
            .select('SUM(p.unitPrice * sale.quantity)', 'sum')
            .where('sale.employeeId = :id', { id })
            .andWhere('sale.soldAt >= :start AND sale.soldAt < :end', {
                start,
                end,
            })
            .getRawOne();
        const productRevenue = Number(productResult?.sum ?? 0);

        const salesCountResult = await this.sales
            .createQueryBuilder('sale')
            .select('COUNT(*)', 'count')
            .where('sale.employeeId = :id', { id })
            .andWhere('sale.soldAt >= :start AND sale.soldAt < :end', {
                start,
                end,
            })
            .getRawOne();
        const productSales = Number(salesCountResult?.count ?? 0);

        const commissionResult = await this.commissions
            .createQueryBuilder('c')
            .select('SUM(c.amount)', 'sum')
            .where('c.employeeId = :id', { id })
            .andWhere('c.createdAt >= :start AND c.createdAt < :end', {
                start,
                end,
            })
            .getRawOne();
        const commissionTotal = Number(commissionResult?.sum ?? 0);

        return {
            employeeId: id,
            from: start,
            to: end,
            serviceRevenue,
            productRevenue,
            totalRevenue: serviceRevenue + productRevenue,
            commissionTotal,
            completedAppointments,
            productSales,
        };
    }

    async getTopServices(limit: number) {
        const result = await this.appointments
            .createQueryBuilder('a')
            .leftJoin('a.service', 's')
            .select('s.id', 'serviceId')
            .addSelect('s.name', 'name')
            .addSelect('COUNT(*)', 'count')
            .addSelect('SUM(s.price)', 'revenue')
            .where('a.paymentStatus = :status', {
                status: PaymentStatus.Paid,
            })
            .groupBy('s.id')
            .addGroupBy('s.name')
            .orderBy('revenue', 'DESC')
            .addOrderBy('count', 'DESC')
            .limit(limit)
            .getRawMany();

        return result.map((row) => ({
            serviceId: Number(row.serviceId),
            name: row.name,
            count: Number(row.count),
            revenue: Number(row.revenue),
        }));
    }

    async getTopProducts(limit: number) {
        const result = await this.sales
            .createQueryBuilder('sale')
            .leftJoin('sale.product', 'p')
            .select('p.id', 'productId')
            .addSelect('p.name', 'name')
            .addSelect('SUM(sale.quantity)', 'quantity')
            .addSelect('SUM(p.unitPrice * sale.quantity)', 'revenue')
            .groupBy('p.id')
            .addGroupBy('p.name')
            .orderBy('revenue', 'DESC')
            .addOrderBy('quantity', 'DESC')
            .limit(limit)
            .getRawMany();

        return result.map((row) => ({
            productId: Number(row.productId),
            name: row.name,
            quantity: Number(row.quantity),
            revenue: Number(row.revenue),
        }));
    }

    async getNewCustomers(from?: string, to?: string) {
        const start = from ? new Date(from) : undefined;
        const end = to ? new Date(to) : undefined;

        const clientIds = new Set<number>();

        const userQb = this.users
            .createQueryBuilder('u')
            .select('u.id', 'id')
            .where('u.role = :role', { role: Role.Client });
        if (start) {
            userQb.andWhere('u.createdAt >= :start', { start });
        }
        if (end) {
            userQb.andWhere('u.createdAt < :end', { end });
        }
        const users = await userQb.getRawMany();
        users.forEach((row) => clientIds.add(Number(row.id)));

        const logQb = this.logs
            .createQueryBuilder('l')
            .select('l.userId', 'id')
            .leftJoin('l.user', 'u')
            .where('l.action = :action', { action: LogAction.RegisterSuccess })
            .andWhere('l.userId IS NOT NULL')
            .andWhere('u.role = :role', { role: Role.Client });
        if (start) {
            logQb.andWhere('l.timestamp >= :start', { start });
        }
        if (end) {
            logQb.andWhere('l.timestamp < :end', { end });
        }
        const logs = await logQb.getRawMany();
        logs.forEach((row) => clientIds.add(Number(row.id)));

        return { from: start, to: end, count: clientIds.size };
    }

    async export(type: string) {
        switch (type) {
            case 'financial':
                return this.exportFinancial();
            case 'services':
                return this.exportServices();
            case 'products':
                return this.exportProducts();
            case 'customers':
                return this.exportCustomers();
            default:
                throw new Error(`Unknown export type: ${type}`);
        }
    }

    private async exportFinancial() {
        const data = await this.getFinancialSummary();
        const parser = new Parser({
            fields: [
                'from',
                'to',
                'serviceRevenue',
                'productRevenue',
                'totalRevenue',
                'commissionTotal',
                'serviceCount',
                'newClients',
                'averageBasketSize',
            ],
        });
        const csv = parser.parse([data]);
        return { fileName: 'financial.csv', csv };
    }

    private async exportServices() {
        const data = await this.getTopServices(100);
        const parser = new Parser({
            fields: ['serviceId', 'name', 'count', 'revenue'],
        });
        const csv = parser.parse(data);
        return { fileName: 'services.csv', csv };
    }

    private async exportProducts() {
        const data = await this.getTopProducts(100);
        const parser = new Parser({
            fields: ['productId', 'name', 'quantity', 'revenue'],
        });
        const csv = parser.parse(data);
        return { fileName: 'products.csv', csv };
    }

    private async exportCustomers() {
        const customers = await this.users.find({ where: { role: Role.Client } });
        const data = customers.map((c) => ({
            id: c.id,
            firstName: c.firstName,
            lastName: c.lastName,
            email: c.email,
            createdAt: c.createdAt.toISOString(),
        }));
        const parser = new Parser({
            fields: ['id', 'firstName', 'lastName', 'email', 'createdAt'],
        });
        const csv = parser.parse(data);
        return { fileName: 'customers.csv', csv };
    }

    async getFinancialSummary(from?: Date, to?: Date) {
        const now = new Date();
        const start = from ?? new Date(now.getFullYear(), now.getMonth(), 1);
        const end =
            to ?? new Date(start.getFullYear(), start.getMonth() + 1, 1);

        const serviceResult = await this.appointments
            .createQueryBuilder('a')
            .leftJoin('a.service', 's')
            .select('SUM(s.price)', 'sum')
            .where('a.paymentStatus = :status', {
                status: PaymentStatus.Paid,
            })
            .andWhere('a.startTime >= :start AND a.startTime < :end', {
                start,
                end,
            })
            .getRawOne();
        const serviceRevenue = Number(serviceResult?.sum ?? 0);

        const productResult = await this.sales
            .createQueryBuilder('sale')
            .leftJoin('sale.product', 'p')
            .select('SUM(p.unitPrice * sale.quantity)', 'sum')
            .where('sale.soldAt >= :start AND sale.soldAt < :end', {
                start,
                end,
            })
            .getRawOne();
        const productRevenue = Number(productResult?.sum ?? 0);

        const servicePerEmployee = await this.appointments
            .createQueryBuilder('a')
            .leftJoin('a.service', 's')
            .select('a.employeeId', 'employeeId')
            .addSelect('SUM(s.price)', 'serviceRevenue')
            .where('a.paymentStatus = :status', {
                status: PaymentStatus.Paid,
            })
            .andWhere('a.startTime >= :start AND a.startTime < :end', {
                start,
                end,
            })
            .groupBy('a.employeeId')
            .getRawMany();

        const salesPerEmployee = await this.sales
            .createQueryBuilder('sale')
            .leftJoin('sale.product', 'p')
            .select('sale.employeeId', 'employeeId')
            .addSelect('SUM(p.unitPrice * sale.quantity)', 'productRevenue')
            .where('sale.soldAt >= :start AND sale.soldAt < :end', {
                start,
                end,
            })
            .groupBy('sale.employeeId')
            .getRawMany();

        const revenueMap = new Map<
            number,
            { serviceRevenue: number; productRevenue: number }
        >();
        for (const row of servicePerEmployee) {
            const id = Number(row.employeeId);
            revenueMap.set(id, {
                serviceRevenue: Number(row.serviceRevenue ?? 0),
                productRevenue: 0,
            });
        }
        for (const row of salesPerEmployee) {
            const id = Number(row.employeeId);
            const existing =
                revenueMap.get(id) || {
                    serviceRevenue: 0,
                    productRevenue: 0,
                };
            existing.productRevenue = Number(row.productRevenue ?? 0);
            revenueMap.set(id, existing);
        }
        const revenuePerEmployee = Array.from(revenueMap.entries()).map(
            ([employeeId, r]) => ({
                employeeId,
                serviceRevenue: r.serviceRevenue,
                productRevenue: r.productRevenue,
                totalRevenue: r.serviceRevenue + r.productRevenue,
            }),
        );

        const commissionResult = await this.commissions
            .createQueryBuilder('c')
            .select('SUM(c.amount)', 'sum')
            .where('c.createdAt >= :start AND c.createdAt < :end', {
                start,
                end,
            })
            .getRawOne();
        const commissionTotal = Number(commissionResult?.sum ?? 0);

        const commissionPerEmployeeRaw = await this.commissions
            .createQueryBuilder('c')
            .select('c.employeeId', 'employeeId')
            .addSelect('SUM(c.amount)', 'amount')
            .where('c.createdAt >= :start AND c.createdAt < :end', {
                start,
                end,
            })
            .groupBy('c.employeeId')
            .getRawMany();
        const commissionPerEmployee = commissionPerEmployeeRaw.map((r) => ({
            employeeId: Number(r.employeeId),
            amount: Number(r.amount),
        }));

        const serviceCount = await this.appointments.count({
            where: {
                paymentStatus: PaymentStatus.Paid,
                startTime: Between(start, end),
            },
        });

        const newClients = await this.users.count({
            where: {
                role: Role.Client,
                createdAt: Between(start, end),
            },
        });

        const salesCount = await this.sales.count({
            where: { soldAt: Between(start, end) },
        });
        const averageBasketSize =
            salesCount > 0 ? productRevenue / salesCount : 0;

        return {
            from: start,
            to: end,
            serviceRevenue,
            productRevenue,
            totalRevenue: serviceRevenue + productRevenue,
            revenuePerEmployee,
            commissionTotal,
            commissionPerEmployee,
            serviceCount,
            newClients,
            averageBasketSize,
        };
    }
}
