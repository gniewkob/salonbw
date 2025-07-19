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
        return this.service.findEmployeeAppointments(req.user.id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update appointment by employee' })
    update(
        @Param('id') id: number,
        @Body() dto: UpdateAppointmentDto,
        @Request() req,
    ) {
        return this.service.updateForUser(
            Number(id),
            req.user.id,
            Role.Employee,
            dto,
        );
    }

    @Patch(':id/cancel')
    @ApiOperation({ summary: 'Cancel appointment by employee' })
    cancel(@Param('id') id: number, @Request() req) {
        return this.service.cancel(Number(id), req.user.id, req.user.role);
    }

    @Patch(':id/complete')
    @ApiOperation({ summary: 'Mark appointment completed by employee' })
    complete(@Param('id') id: number, @Request() req) {
        return this.service.complete(Number(id), req.user.id, req.user.role);
    }
}
