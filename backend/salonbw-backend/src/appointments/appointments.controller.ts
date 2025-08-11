import {
    Body,
    Controller,
    Get,
    Param,
    Patch,
    Post,
    UseGuards,
    ForbiddenException,
    BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/current-user.decorator';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Role } from '../users/role.enum';
import { AppointmentsService } from './appointments.service';
import { Appointment } from './appointment.entity';
import { User } from '../users/user.entity';
import { Service as SalonService } from '../services/service.entity';

@Controller('appointments')
export class AppointmentsController {
    constructor(private readonly appointmentsService: AppointmentsService) {}

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Client, Role.Employee, Role.Admin)
    @Post()
    create(
        @Body()
        body: {
            employeeId: number;
            serviceId: number;
            startTime: string;
            endTime: string;
            notes?: string;
            clientId?: number;
        },
        @CurrentUser() user: { userId: number; role: Role },
    ): Promise<Appointment> {
        const clientId =
            user.role === Role.Client || user.role === Role.Admin
                ? user.userId
                : body.clientId;
        if (user.role === Role.Employee && !clientId) {
            throw new BadRequestException('clientId is required');
        }
        return this.appointmentsService.create(
            {
                client: { id: clientId } as User,
                employee: { id: body.employeeId } as User,
                service: { id: body.serviceId } as SalonService,
                startTime: new Date(body.startTime),
                endTime: new Date(body.endTime),
                notes: body.notes,
            },
            user,
        );
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Client, Role.Employee, Role.Admin)
    @Get('me')
    findMine(@CurrentUser() user: { userId: number }): Promise<Appointment[]> {
        return this.appointmentsService.findForUser(user.userId);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Client, Role.Employee, Role.Admin)
    @Patch(':id/cancel')
    async cancel(
        @Param('id') id: string,
        @CurrentUser() user: { userId: number; role: Role },
    ): Promise<Appointment | null> {
        const appointment = await this.appointmentsService.findOne(Number(id));
        if (
            !appointment ||
            (user.role !== Role.Admin &&
                appointment.client.id !== user.userId &&
                appointment.employee.id !== user.userId)
        ) {
            throw new ForbiddenException();
        }
        return this.appointmentsService.cancel(Number(id));
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Employee, Role.Admin)
    @Patch(':id/complete')
    async complete(
        @Param('id') id: string,
        @CurrentUser() user: { userId: number; role: Role },
    ): Promise<Appointment | null> {
        const appointment = await this.appointmentsService.findOne(Number(id));
        if (
            !appointment ||
            (user.role !== Role.Admin &&
                appointment.employee.id !== user.userId)
        ) {
            throw new ForbiddenException();
        }
        return this.appointmentsService.completeAppointment(Number(id));
    }
}
