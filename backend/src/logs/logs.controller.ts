import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../users/role.enum';
import { LogsService } from './logs.service';
import { LogAction } from './action.enum';

@Controller('logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin)
export class LogsController {
    constructor(private readonly service: LogsService) {}

    @Get()
    list(
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('action') action?: LogAction,
        @Query('userId') userId?: string,
    ) {
        return this.service.findAll({
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            action,
            userId: userId ? Number(userId) : undefined,
        });
    }
}
