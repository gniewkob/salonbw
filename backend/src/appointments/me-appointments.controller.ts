import { ApiErrorResponses } from '../common/decorators/api-error-responses.decorator';
import {
    Controller,
    Get,
    Request,
    UseGuards,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../users/role.enum';
import { Request as ExpressRequest } from 'express';
import { EmployeeRole } from '../employees/employee-role.enum';

interface AuthRequest extends ExpressRequest {
    user: { id: number; role: Role | EmployeeRole };
}

@ApiTags('Appointments')
@ApiBearerAuth()
@Controller('appointments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin, Role.Employee, Role.Client)
export class MeAppointmentsController {
    constructor(private readonly service: AppointmentsService) {}

    @Get('me')
    @ApiOperation({ summary: 'List appointments for current user' })
    @ApiResponse({ status: 200 })
    @ApiErrorResponses()
    list(@Request() req: AuthRequest) {
        const { id, role } = req.user;
        if (role === Role.Client) {
            return this.service.findClientAppointments(Number(id));
        }
        if (role === Role.Employee) {
            return this.service.findEmployeeAppointments(Number(id));
        }
        return this.service.findAll();
    }
}
