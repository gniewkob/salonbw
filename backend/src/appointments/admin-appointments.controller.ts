import { ApiErrorResponses } from '../common/decorators/api-error-responses.decorator';
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
    Query,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiQuery,
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
import { AppointmentStatus } from './appointment.entity';

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
    @ApiErrorResponses()
    @ApiQuery({ name: 'employeeId', required: false })
    @ApiQuery({ name: 'startDate', required: false })
    @ApiQuery({ name: 'endDate', required: false })
    @ApiQuery({ name: 'status', enum: AppointmentStatus, required: false })
    list(
        @Query('employeeId') employeeId?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('status') status?: AppointmentStatus,
    ) {
        return this.service.findAll({
            employeeId: employeeId ? Number(employeeId) : undefined,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            status,
        });
    }

    @Post()
    @ApiOperation({ summary: 'Create appointment' })
    @ApiResponse({ status: 201 })
    @ApiErrorResponses()
    create(@Body() dto: CreateAppointmentDto, @Request() req: AuthRequest) {
        return this.service.create(
            dto.clientId,
            dto.employeeId,
            dto.serviceId,
            dto.startTime,
            dto.notes,
            req.user.id,
        );
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update appointment' })
    @ApiResponse({ status: 200 })
    @ApiErrorResponses()
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
