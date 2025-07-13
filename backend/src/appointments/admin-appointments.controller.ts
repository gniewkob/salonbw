import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../users/role.enum';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

@Controller('appointments/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin)
export class AdminAppointmentsController {
    constructor(private readonly service: AppointmentsService) {}

    @Get()
    list() {
        return this.service.findAll();
    }

    @Post()
    create(@Body() dto: CreateAppointmentDto) {
        return this.service.create(dto.clientId, dto.employeeId, dto.scheduledAt);
    }

    @Patch(':id')
    update(@Param('id') id: number, @Body() dto: UpdateAppointmentDto) {
        return this.service.update(Number(id), dto);
    }

    @Delete(':id')
    remove(@Param('id') id: number) {
        return this.service.remove(Number(id));
    }
}
