import { Controller, Get, Param, Request, ForbiddenException, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../users/role.enum';
import { ChatMessagesService } from './chat-messages.service';
import { AppointmentsService } from '../appointments/appointments.service';

@Controller('appointments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AppointmentChatController {
    constructor(
        private readonly chat: ChatMessagesService,
        private readonly appointments: AppointmentsService,
    ) {}

    @Get(':id/chat')
    @Roles(Role.Client, Role.Employee)
    async list(@Param('id') id: number, @Request() req) {
        const appt = await this.appointments.findOne(Number(id));
        if (!appt) {
            throw new ForbiddenException();
        }
        if (
            req.user.role !== Role.Admin &&
            appt.client.id !== req.user.id &&
            appt.employee.id !== req.user.id
        ) {
            throw new ForbiddenException();
        }
        return this.chat.findForAppointment(Number(id));
    }
}
