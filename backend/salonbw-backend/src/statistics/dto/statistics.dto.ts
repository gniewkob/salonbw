import { IsString, IsOptional, IsNumber, IsEnum, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export enum DateRange {
    Today = 'today',
    Yesterday = 'yesterday',
    ThisWeek = 'this_week',
    LastWeek = 'last_week',
    ThisMonth = 'this_month',
    LastMonth = 'last_month',
    ThisYear = 'this_year',
    Custom = 'custom',
}

export enum GroupBy {
    Day = 'day',
    Week = 'week',
    Month = 'month',
}

export class StatisticsQueryDto {
    @IsEnum(DateRange)
    @IsOptional()
    range?: DateRange;

    @IsOptional()
    @IsDate()
    @Type(() => Date)
    from?: Date;

    @IsOptional()
    @IsDate()
    @Type(() => Date)
    to?: Date;

    @IsNumber()
    @IsOptional()
    employeeId?: number;

    @IsNumber()
    @IsOptional()
    serviceId?: number;

    @IsEnum(GroupBy)
    @IsOptional()
    groupBy?: GroupBy;
}

export class SingleDateQueryDto {
    @IsOptional()
    @IsDate()
    @Type(() => Date)
    date?: Date;
}

export interface DashboardStats {
    todayRevenue: number;
    todayProductRevenue: number;
    todayAppointments: number;
    todayCompletedAppointments: number;
    todayNewCustomers: number;
    weekRevenue: number;
    weekProductRevenue: number;
    weekAppointments: number;
    monthRevenue: number;
    monthProductRevenue: number;
    monthAppointments: number;
    pendingAppointments: number;
    averageRating: number;
    monthDailyAppointments: Array<{
        date: string;
        count: number;
    }>;
    monthDailyNewCustomers: Array<{
        date: string;
        count: number;
    }>;
    monthDailyRevenue: Array<{
        date: string;
        serviceRevenue: number;
        productRevenue: number;
        totalRevenue: number;
    }>;
}

export interface RevenueDataPoint {
    date: string;
    label: string;
    revenue: number;
    appointments: number;
    tips: number;
    products: number;
}

export interface EmployeeStats {
    employeeId: number;
    employeeName: string;
    revenue: number;
    appointments: number;
    completedAppointments: number;
    averageDuration: number;
    averageRevenue: number;
    tips: number;
    rating: number;
    reviewCount: number;
}

export interface EmployeeActivity {
    employeeId: number;
    employeeName: string;
    workTimeMinutes: number;
    appointmentsCount: number;
}

export interface EmployeeActivitySummary {
    date: string;
    employees: EmployeeActivity[];
    totals: {
        workTimeMinutes: number;
        appointmentsCount: number;
    };
}

export interface ServiceStats {
    serviceId: number;
    serviceName: string;
    categoryName: string | null;
    bookingCount: number;
    revenue: number;
    averagePrice: number;
    averageDuration: number;
}

export interface CustomerStats {
    newCustomers: number;
    returningCustomers: number;
    totalVisits: number;
    averageVisitsPerCustomer: number;
    topClients: Array<{
        customerId: number;
        customerName: string;
        visits: number;
        totalSpent: number;
    }>;
}

export interface CustomerReturningStats {
    totalCustomers: number;
    returningCustomers: number;
    returningPercentage: number;
    newCustomers: number;
    newPercentage: number;
    byMonth: Array<{
        month: string;
        newCustomers: number;
        returningCustomers: number;
    }>;
}

export interface CustomerOriginStats {
    totalCustomers: number;
    origins: Array<{
        origin: string;
        count: number;
        percentage: number;
    }>;
}

export interface CashRegisterEntry {
    id: number;
    time: string;
    type: 'appointment' | 'product' | 'other';
    description: string;
    paymentMethod: string;
    amount: number;
    tip: number;
    employeeName: string | null;
    customerName: string | null;
}

export interface CashRegisterSummary {
    date: string;
    entries: CashRegisterEntry[];
    totals: {
        cash: number;
        card: number;
        transfer: number;
        online: number;
        voucher: number;
        total: number;
        tips: number;
    };
}

export interface TipsSummary {
    employeeId: number;
    employeeName: string;
    tipsCount: number;
    tipsTotal: number;
    averageTip: number;
}

export interface CommissionReport {
    employeeId: number;
    employeeName: string;
    serviceRevenue: number;
    serviceCommission: number;
    productRevenue: number;
    productCommission: number;
    totalRevenue: number;
    totalCommission: number;
}

export interface CommissionReportSummary {
    date: string;
    employees: CommissionReport[];
    totals: {
        serviceRevenue: number;
        serviceCommission: number;
        productRevenue: number;
        productCommission: number;
        totalRevenue: number;
        totalCommission: number;
    };
}

export interface WarehouseMovementStats {
    totalMovements: number;
    byType: Array<{
        type: string;
        count: number;
        quantityChange: number;
    }>;
    recentMovements: Array<{
        id: number;
        productName: string;
        type: string;
        quantity: number;
        quantityBefore: number;
        quantityAfter: number;
        createdAt: string;
        createdByName: string | null;
    }>;
}

export interface WarehouseValueStats {
    totalProducts: number;
    totalValue: number;
    totalQuantity: number;
    byCategory: Array<{
        category: string;
        productCount: number;
        totalValue: number;
        totalQuantity: number;
    }>;
    lowStockProducts: Array<{
        id: number;
        name: string;
        quantity: number;
        minQuantity: number;
        price: number;
    }>;
}

export interface WorkTimeReport {
    employeeId: number;
    employeeName: string;
    totalWorkTimeMinutes: number;
    totalAppointments: number;
    workingDays: number;
    averageWorkTimePerDay: number;
    byDay: Array<{
        date: string;
        workTimeMinutes: number;
        appointmentsCount: number;
    }>;
}
