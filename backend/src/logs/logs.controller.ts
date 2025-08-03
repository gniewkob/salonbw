import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../users/role.enum';
import { LogsService } from './logs.service';
import { LogAction } from './action.enum';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';

@ApiTags('Logs')
@ApiBearerAuth()
@Controller('logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin)
export class LogsController {
    constructor(private readonly service: LogsService) {}

    @Get()
    @ApiQuery({ name: 'startDate', required: false })
    @ApiQuery({ name: 'endDate', required: false })
    @ApiQuery({ name: 'action', enum: LogAction, required: false })
    @ApiQuery({ name: 'userId', required: false })
    @ApiQuery({ name: 'actorId', required: false })
    list(
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('action') action?: LogAction,
        @Query('userId') userId?: string,
        @Query('actorId') actorId?: string,
    ) {
        return this.service.findAll({
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            action,
            userId: userId ? Number(userId) : undefined,
            actorId: actorId ? Number(actorId) : undefined,
        });
    }
}
