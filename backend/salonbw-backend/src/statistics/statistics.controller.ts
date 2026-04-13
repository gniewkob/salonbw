import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../users/role.enum';
import { StatisticsService } from './statistics.service';
import {
    DateRange,
    GroupBy,
    StatisticsQueryDto,
    SingleDateQueryDto,
} from './dto/statistics.dto';

@Controller('statistics')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class StatisticsController {
    constructor(private readonly statisticsService: StatisticsService) {}

    @Get('dashboard')
    @Roles(Role.Admin, Role.Receptionist)
    async getDashboard() {
        return this.statisticsService.getDashboard();
    }

    @Get('revenue')
    @Roles(Role.Admin)
    async getRevenueChart(@Query() query: StatisticsQueryDto) {
        const { from: fromDate, to: toDate } =
            this.statisticsService.resolveDateRange(
                query.range ?? DateRange.ThisMonth,
                query.from,
                query.to,
            );

        return this.statisticsService.getRevenueChart(
            fromDate,
            toDate,
            query.groupBy ?? GroupBy.Day,
            query.employeeId,
        );
    }

    @Get('employees')
    @Roles(Role.Admin)
    async getEmployeeRanking(@Query() query: StatisticsQueryDto) {
        const { from: fromDate, to: toDate } =
            this.statisticsService.resolveDateRange(
                query.range ?? DateRange.ThisMonth,
                query.from,
                query.to,
            );

        return this.statisticsService.getEmployeeRanking(fromDate, toDate);
    }

    @Get('employees/activity')
    @Roles(Role.Admin)
    async getEmployeeActivity(@Query() query: SingleDateQueryDto) {
        return this.statisticsService.getEmployeeActivity(
            query.date ?? new Date(),
        );
    }

    @Get('services')
    @Roles(Role.Admin)
    async getServiceRanking(@Query() query: StatisticsQueryDto) {
        const { from: fromDate, to: toDate } =
            this.statisticsService.resolveDateRange(
                query.range ?? DateRange.ThisMonth,
                query.from,
                query.to,
            );

        return this.statisticsService.getServiceRanking(fromDate, toDate);
    }

    @Get('customers')
    @Roles(Role.Admin)
    async getCustomerStats(@Query() query: StatisticsQueryDto) {
        const { from: fromDate, to: toDate } =
            this.statisticsService.resolveDateRange(
                query.range ?? DateRange.ThisMonth,
                query.from,
                query.to,
            );

        return this.statisticsService.getCustomerStats(fromDate, toDate);
    }

    @Get('register')
    @Roles(Role.Admin, Role.Receptionist)
    async getCashRegister(@Query() query: SingleDateQueryDto) {
        return this.statisticsService.getCashRegister(
            query.date ?? new Date(),
        );
    }

    @Get('tips')
    @Roles(Role.Admin)
    async getTipsSummary(@Query() query: StatisticsQueryDto) {
        const { from: fromDate, to: toDate } =
            this.statisticsService.resolveDateRange(
                query.range ?? DateRange.ThisMonth,
                query.from,
                query.to,
            );

        return this.statisticsService.getTipsSummary(fromDate, toDate);
    }

    @Get('commissions')
    @Roles(Role.Admin)
    async getCommissionReport(@Query() query: StatisticsQueryDto) {
        const { from: fromDate, to: toDate } =
            this.statisticsService.resolveDateRange(
                query.range ?? DateRange.ThisMonth,
                query.from,
                query.to,
            );

        return this.statisticsService.getCommissionReport(fromDate, toDate);
    }

    @Get('customers/returning')
    @Roles(Role.Admin)
    async getCustomerReturningStats(@Query() query: StatisticsQueryDto) {
        const { from: fromDate, to: toDate } =
            this.statisticsService.resolveDateRange(
                query.range ?? DateRange.ThisMonth,
                query.from,
                query.to,
            );

        return this.statisticsService.getCustomerReturningStats(
            fromDate,
            toDate,
        );
    }

    @Get('customers/origins')
    @Roles(Role.Admin)
    async getCustomerOriginStats(@Query() query: StatisticsQueryDto) {
        const { from: fromDate, to: toDate } =
            this.statisticsService.resolveDateRange(
                query.range ?? DateRange.ThisMonth,
                query.from,
                query.to,
            );

        return this.statisticsService.getCustomerOriginStats(fromDate, toDate);
    }

    @Get('warehouse/movements')
    @Roles(Role.Admin)
    async getWarehouseMovementStats(@Query() query: StatisticsQueryDto) {
        const { from: fromDate, to: toDate } =
            this.statisticsService.resolveDateRange(
                query.range ?? DateRange.ThisMonth,
                query.from,
                query.to,
            );

        return this.statisticsService.getWarehouseMovementStats(
            fromDate,
            toDate,
        );
    }

    @Get('warehouse/value')
    @Roles(Role.Admin)
    async getWarehouseValueStats() {
        return this.statisticsService.getWarehouseValueStats();
    }

    @Get('worktime')
    @Roles(Role.Admin)
    async getWorkTimeReport(@Query() query: StatisticsQueryDto) {
        const { from: fromDate, to: toDate } =
            this.statisticsService.resolveDateRange(
                query.range ?? DateRange.ThisMonth,
                query.from,
                query.to,
            );

        return this.statisticsService.getWorkTimeReport(fromDate, toDate);
    }
}
