import {
    Body,
    Controller,
    ForbiddenException,
    Param,
    Post,
    Request,
    UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../users/role.enum';
import { AppointmentsService } from '../appointments/appointments.service';
import { FormulasService } from './formulas.service';
import { CreateAppointmentFormulaDto } from './dto/create-appointment-formula.dto';

@Controller('appointments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AppointmentFormulasController {
    constructor(
        private readonly appointments: AppointmentsService,
        private readonly formulas: FormulasService,
    ) {}

    @Post(':id/formulas')
    @Roles(Role.Employee, Role.Admin)
    async create(
        @Param('id') id: number,
        @Body() dto: CreateAppointmentFormulaDto,
        @Request() req,
    ) {
        const appointment = await this.appointments.findOne(Number(id));
        if (!appointment) {
            throw new ForbiddenException();
        }
        if (
            req.user.role !== Role.Admin &&
            appointment.employee.id !== req.user.id
        ) {
            throw new ForbiddenException();
        }
        return this.formulas.create(
            appointment.client.id,
            dto.description,
            appointment.id,
        );
    }
}
