import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';

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

    @IsString()
    @IsOptional()
    from?: string;

    @IsString()
    @IsOptional()
    to?: string;

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

export interface DashboardStats {
    todayRevenue: number;
    todayAppointments: number;
    todayCompletedAppointments: number;
    todayNewClients: number;
    weekRevenue: number;
    weekAppointments: number;
    monthRevenue: number;
    monthAppointments: number;
    pendingAppointments: number;
    averageRating: number;
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

export interface ServiceStats {
    serviceId: number;
    serviceName: string;
    categoryName: string | null;
    bookingCount: number;
    revenue: number;
    averagePrice: number;
    averageDuration: number;
}

export interface ClientStats {
    newClients: number;
    returningClients: number;
    totalVisits: number;
    averageVisitsPerClient: number;
    topClients: Array<{
        clientId: number;
        clientName: string;
        visits: number;
        totalSpent: number;
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
    clientName: string | null;
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
