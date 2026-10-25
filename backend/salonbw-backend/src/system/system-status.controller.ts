import {
    Controller,
    ForbiddenException,
    Get,
    Header,
    UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../auth/current-user.decorator';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UsersService } from '../users/users.service';
import { Role } from '../users/role.enum';
import { SystemStatusService } from './system-status.service';

@ApiTags('system')
@ApiBearerAuth()
@Controller('system')
export class SystemStatusController {
    constructor(
        private readonly users: UsersService,
        private readonly system: SystemStatusService,
    ) {}

    @Get('status')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin)
    @Throttle({ default: { limit: 10, ttl: 60000 } })
    @Header('Cache-Control', 'no-store')
    @ApiOperation({
        summary: 'Current dependency status for system administrators',
    })
    @ApiResponse({
        status: 200,
        description:
            'Sanitized technical status; connectivity does not prove message delivery',
    })
    @ApiResponse({ status: 401, description: 'Authentication required' })
    @ApiResponse({ status: 403, description: 'System administrator required' })
    async status(@CurrentUser() actor: { userId: number; role: Role }) {
        const user = await this.users.findById(actor.userId);
        if (
            actor.role !== Role.Admin ||
            user?.role !== Role.Admin ||
            !user.isSystemAdmin
        ) {
            throw new ForbiddenException('System administrator required');
        }
        return this.system.getStatus();
    }
}
