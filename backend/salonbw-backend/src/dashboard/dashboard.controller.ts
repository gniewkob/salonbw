import { Controller, Get, UseGuards } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/current-user.decorator';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Role } from '../users/role.enum';
import { User } from '../users/user.entity';
import { DashboardService } from './dashboard.service';
import { DashboardSummaryDto } from './dto/dashboard-summary.dto';
import { ClientDashboardDto } from './dto/client-dashboard.dto';

@ApiTags('dashboard')
@Controller('dashboard')
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) {}

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Employee, Role.Admin)
    @Get()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get dashboard summary' })
    @ApiResponse({ status: 200, type: DashboardSummaryDto })
    getSummary(): Promise<DashboardSummaryDto> {
        return this.dashboardService.getSummary();
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Client)
    @Get('client')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get client dashboard summary' })
    @ApiResponse({ status: 200, type: ClientDashboardDto })
    getClientSummary(@CurrentUser() user: User): Promise<ClientDashboardDto> {
        return this.dashboardService.getClientSummary(user.id);
    }
}
