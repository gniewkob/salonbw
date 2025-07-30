import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DashboardService } from './dashboard.service';
import { Role } from '../users/role.enum';
import { EmployeeRole } from '../employees/employee-role.enum';
import { Request as ExpressRequest } from 'express';

interface AuthRequest extends ExpressRequest {
    user: { id: number; role: Role | EmployeeRole };
}

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
    constructor(private readonly service: DashboardService) {}

    @Get()
    @ApiOperation({ summary: 'Get dashboard summary for logged user' })
    @ApiResponse({ status: 200 })
    getDashboard(@Request() req: AuthRequest) {
        return this.service.getSummary(req.user.id, req.user.role);
    }
}
