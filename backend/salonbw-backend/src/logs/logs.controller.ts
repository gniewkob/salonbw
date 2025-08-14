import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Role } from '../users/role.enum';
import { LogAction } from './log-action.enum';
import { LogService } from './log.service';

@Controller('logs')
export class LogsController {
    constructor(private readonly logService: LogService) {}

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin)
    @Get()
    getLogs(
        @Query('userId') userId?: string,
        @Query('action') action?: LogAction,
        @Query('from') from?: string,
        @Query('to') to?: string,
        @Query('page') page = '1',
        @Query('limit') limit = '10',
    ) {
        return this.logService.findAll({
            userId: userId ? Number(userId) : undefined,
            action,
            from: from ? new Date(from) : undefined,
            to: to ? new Date(to) : undefined,
            page: Number(page),
            limit: Number(limit),
        });
    }
}
