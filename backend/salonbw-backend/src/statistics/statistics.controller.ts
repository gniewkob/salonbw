import {
    Controller,
    Get,
    Query,
    UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../users/role.enum';
import { StatisticsService } from './statistics.service';
import { DateRange, GroupBy } from './dto/statistics.dto';

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
    async getRevenueChart(
        @Query('range') range?: DateRange,
        @Query('from') from?: string,
        @Query('to') to?: string,
        @Query('groupBy') groupBy?: GroupBy,
        @Query('employeeId') employeeId?: string,
    ) {
        const { from: fromDate, to: toDate } = this.statisticsService.resolveDateRange(
            range ?? DateRange.ThisMonth,
            from,
            to,
        );

        return this.statisticsService.getRevenueChart(
            fromDate,
            toDate,
            groupBy ?? GroupBy.Day,
            employeeId ? parseInt(employeeId, 10) : undefined,
        );
    }

    @Get('employees')
    @Roles(Role.Admin)
    async getEmployeeRanking(
        @Query('range') range?: DateRange,
        @Query('from') from?: string,
        @Query('to') to?: string,
    ) {
        const { from: fromDate, to: toDate } = this.statisticsService.resolveDateRange(
            range ?? DateRange.ThisMonth,
            from,
            to,
        );

        return this.statisticsService.getEmployeeRanking(fromDate, toDate);
    }

    @Get('services')
    @Roles(Role.Admin)
    async getServiceRanking(
        @Query('range') range?: DateRange,
        @Query('from') from?: string,
        @Query('to') to?: string,
    ) {
        const { from: fromDate, to: toDate } = this.statisticsService.resolveDateRange(
            range ?? DateRange.ThisMonth,
            from,
            to,
        );

        return this.statisticsService.getServiceRanking(fromDate, toDate);
    }

    @Get('clients')
    @Roles(Role.Admin)
    async getClientStats(
        @Query('range') range?: DateRange,
        @Query('from') from?: string,
        @Query('to') to?: string,
    ) {
        const { from: fromDate, to: toDate } = this.statisticsService.resolveDateRange(
            range ?? DateRange.ThisMonth,
            from,
            to,
        );

        return this.statisticsService.getClientStats(fromDate, toDate);
    }

    @Get('register')
    @Roles(Role.Admin, Role.Receptionist)
    async getCashRegister(@Query('date') date?: string) {
        const registerDate = date ? new Date(date) : new Date();
        return this.statisticsService.getCashRegister(registerDate);
    }

    @Get('tips')
    @Roles(Role.Admin)
    async getTipsSummary(
        @Query('range') range?: DateRange,
        @Query('from') from?: string,
        @Query('to') to?: string,
    ) {
        const { from: fromDate, to: toDate } = this.statisticsService.resolveDateRange(
            range ?? DateRange.ThisMonth,
            from,
            to,
        );

        return this.statisticsService.getTipsSummary(fromDate, toDate);
    }
}
