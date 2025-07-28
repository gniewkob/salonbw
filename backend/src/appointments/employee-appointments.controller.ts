import {
    Body,
    Controller,
    Get,
    Param,
    Patch,
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
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { Request as ExpressRequest } from 'express';

interface AuthRequest extends ExpressRequest {
    user: { id: number; role: Role | EmployeeRole };
}

@ApiTags('Appointments')
@ApiBearerAuth()
@Controller('appointments/employee')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Employee)
export class EmployeeAppointmentsController {
    constructor(private readonly service: AppointmentsService) {}

    @Get()
    @ApiOperation({ summary: 'List appointments assigned to employee' })
    @ApiResponse({ status: 200 })
    list(@Request() req) {
        return this.service.findEmployeeAppointments(Number(req.user.id));
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update appointment by employee' })
    update(
        @Param('id') id: string,
        @Body() dto: UpdateAppointmentDto,
        @Request() req,
    ) {
        return this.service.updateForUser(
            Number(id),
            Number(req.user.id),
            Role.Employee,
            dto,
        );
    }

    @Patch(':id/cancel')
    @ApiOperation({ summary: 'Cancel appointment by employee' })
    cancel(
        @Param('id') id: string,
        @Request() req: AuthRequest,
    ) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        return this.service.cancel(Number(id), req.user.id, req.user.role);
    }

    @Patch(':id/complete')
    @ApiOperation({ summary: 'Mark appointment completed by employee' })
    complete(
        @Param('id') id: string,
        @Request() req: AuthRequest,
    ) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        return this.service.complete(Number(id), req.user.id, req.user.role);
    }
}
