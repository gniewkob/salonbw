import { Body, Controller, Delete, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../users/role.enum';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

@Controller('appointments/client')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Client)
export class ClientAppointmentsController {
    constructor(private readonly service: AppointmentsService) {}

    @Get()
    list(@Request() req) {
        return this.service.findClientAppointments(req.user.id);
    }

    @Post()
    create(@Request() req, @Body() dto: Omit<CreateAppointmentDto, 'clientId'>) {
        return this.service.create(
            req.user.id,
            dto.employeeId,
            dto.serviceId,
            dto.startTime,
        );
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
            Role.Client,
            dto,
        );
    }

    @Delete(':id')
    remove(@Param('id') id: number, @Request() req) {
        return this.service.removeForUser(Number(id), req.user.id, Role.Client);
    }
}
