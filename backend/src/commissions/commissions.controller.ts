import { ApiErrorResponses } from '../common/decorators/api-error-responses.decorator';
import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CommissionsService } from './commissions.service';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../users/role.enum';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';

@ApiTags('Commissions')
@ApiBearerAuth()
@Controller('commissions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CommissionsController {
    constructor(private readonly service: CommissionsService) {}

    @Get('admin')
    @Roles(Role.Admin)
    @ApiOperation({ summary: 'List all commissions' })
    @ApiResponse({ status: 200 })
    @ApiErrorResponses()
    listAll() {
        return this.service.listAll();
    }

    @Get('employee')
    @Roles(Role.Employee)
    @ApiOperation({ summary: 'List commissions for employee' })
    @ApiResponse({ status: 200 })
    @ApiErrorResponses()
    listOwn(@Request() req) {
        return this.service.listForEmployee(Number(req.user.id));
    }
}
