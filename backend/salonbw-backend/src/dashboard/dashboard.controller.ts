import { Controller, Get, UseGuards } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Role } from '../users/role.enum';
import { DashboardService } from './dashboard.service';
import { DashboardSummaryDto } from './dto/dashboard-summary.dto';

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
}
