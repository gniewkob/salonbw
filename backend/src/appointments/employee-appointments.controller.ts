import { Body, Controller, Get, Param, Patch, Request, UseGuards } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../users/role.enum';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

@Controller('appointments/employee')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Employee)
export class EmployeeAppointmentsController {
    constructor(private readonly service: AppointmentsService) {}

    @Get()
    list(@Request() req) {
        return this.service.findEmployeeAppointments(req.user.id);
    }

    @Patch(':id')
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
}
