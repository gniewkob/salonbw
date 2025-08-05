import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import {
    Appointment,
    PaymentStatus,
} from '../appointments/appointment.entity';
import { Sale } from '../sales/sale.entity';
import { CommissionRecord } from '../commissions/commission-record.entity';
import { User } from '../users/user.entity';
import { Role } from '../users/role.enum';

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
    ) {}

    getFinancial(from?: string, to?: string) {
        const start = from ? new Date(from) : undefined;
        const end = to ? new Date(to) : undefined;
        return this.getFinancialSummary(start, end);
    }

    getEmployeeReport(id: number, from?: string, to?: string) {
        return { id, from, to };
    }

    getTopServices(limit: number) {
        return { limit };
    }

    getTopProducts(limit: number) {
        return { limit };
    }

    getNewCustomers(from?: string, to?: string) {
        return { from, to };
    }

    export(type: string) {
        return { type };
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
