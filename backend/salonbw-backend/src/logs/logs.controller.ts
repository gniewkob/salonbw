import { Controller, Get, Query, UseGuards, ValidationPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Role } from '../users/role.enum';
import { LogService } from './log.service';
import { GetLogsDto } from './dto/get-logs.dto';

@Controller('logs')
export class LogsController {
    constructor(private readonly logService: LogService) {}

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin)
    @Get()
    getLogs(
        @Query(new ValidationPipe({ transform: true })) dto: GetLogsDto,
    ) {
        return this.logService.findAll({
            userId: dto.userId,
            action: dto.action,
            from: dto.from ? new Date(dto.from) : undefined,
            to: dto.to ? new Date(dto.to) : undefined,
            page: dto.page,
            limit: dto.limit,
        });
    }
}
