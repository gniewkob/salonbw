import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    UseGuards,
    Request,
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
import { EmployeeRole } from '../employees/employee-role.enum';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { Request as ExpressRequest } from 'express';

interface AuthRequest extends ExpressRequest {
    user: { id: number; role: Role | EmployeeRole };
}

@ApiTags('Appointments')
@ApiBearerAuth()
@Controller('appointments/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin)
export class AdminAppointmentsController {
    constructor(private readonly service: AppointmentsService) {}

    @Get()
    @ApiOperation({ summary: 'List all appointments' })
    @ApiResponse({ status: 200 })
    list() {
        return this.service.findAll();
    }

    @Post()
    @ApiOperation({ summary: 'Create appointment' })
    @ApiResponse({ status: 201 })
    create(@Body() dto: CreateAppointmentDto) {
        return this.service.create(
            dto.clientId,
            dto.employeeId,
            dto.serviceId,
            dto.startTime,
        );
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update appointment' })
    @ApiResponse({ status: 200 })
    update(@Param('id') id: string, @Body() dto: UpdateAppointmentDto) {
        return this.service.update(Number(id), dto);
    }

    @Patch(':id/cancel')
    @ApiOperation({ summary: 'Cancel appointment' })
    cancel(
        @Param('id') id: string,
        @Request() req: AuthRequest,
    ) {

        return this.service.cancel(Number(id), req.user.id, req.user.role);
    }

    @Patch(':id/no-show')
    @ApiOperation({ summary: 'Mark appointment as no-show' })
    noShow(
        @Param('id') id: string,
        @Request() req: AuthRequest,
    ) {
        return this.service.noShow(Number(id), req.user.id, req.user.role);
    }

    @Patch(':id/complete')
    @ApiOperation({ summary: 'Mark appointment completed' })
    complete(
        @Param('id') id: string,
        @Request() req: AuthRequest,
    ) {
         
        return this.service.complete(Number(id), req.user.id, req.user.role);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete appointment' })
    remove(@Param('id') id: string) {
        return this.service.remove(Number(id));
    }
}
