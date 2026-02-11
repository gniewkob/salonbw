import {
    Body,
    Controller,
    Get,
    Headers,
    HttpCode,
    HttpStatus,
    Post,
    Query,
    UnauthorizedException,
    UseGuards,
    ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SkipThrottle } from '@nestjs/throttler';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Role } from '../users/role.enum';
import { LogService } from './log.service';
import { GetLogsDto } from './dto/get-logs.dto';
import { ClientLogDto } from './dto/client-log.dto';

@ApiTags('logs')
@Controller('logs')
export class LogsController {
    constructor(
        private readonly logService: LogService,
        private readonly configService: ConfigService,
        private readonly logger: PinoLogger,
    ) {}

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin)
    @Get()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get logs' })
    @ApiResponse({ status: 200, description: 'List of logs' })
    getLogs(@Query(new ValidationPipe({ transform: true })) dto: GetLogsDto) {
        return this.logService.findAll({
            userId: dto.userId,
            action: dto.action,
            from: dto.from ? new Date(dto.from) : undefined,
            to: dto.to ? new Date(dto.to) : undefined,
            page: dto.page,
            limit: dto.limit,
        });
    }

    @Post('client')
    @SkipThrottle()
    @HttpCode(HttpStatus.ACCEPTED)
    @ApiOperation({ summary: 'Ingest client-side error log' })
    @ApiResponse({ status: 202, description: 'Log accepted' })
    logClientError(
        @Body() dto: ClientLogDto,
        @Headers('x-log-token') token?: string,
    ) {
        const expected = this.configService.get<string>('CLIENT_LOG_TOKEN');
        if (expected && token !== expected) {
            throw new UnauthorizedException('Invalid log token');
        }
        this.logger.error(
            {
                source: 'frontend',
                path: dto.path,
                userAgent: dto.userAgent,
                extra: dto.extra,
                level: dto.level ?? 'error',
            },
            dto.message,
        );
        return { accepted: true };
    }
}
