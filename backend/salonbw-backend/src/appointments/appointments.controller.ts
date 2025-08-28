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
    NotFoundException,
    ParseIntPipe,
    Query,
    ValidationPipe,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/current-user.decorator';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Role } from '../users/role.enum';
import { AppointmentsService } from './appointments.service';
import { Appointment } from './appointment.entity';
import { User } from '../users/user.entity';
import { Service as SalonService } from '../services/service.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { GetAppointmentsDto } from './dto/get-appointments.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

@ApiTags('appointments')
@Controller('appointments')
export class AppointmentsController {
    constructor(private readonly appointmentsService: AppointmentsService) {}

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin)
    @Get()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'List appointments (admin, optional filters)' })
    @ApiResponse({ status: 200, type: Appointment, isArray: true })
    findAll(
        @Query(new ValidationPipe({ transform: true }))
        query: GetAppointmentsDto,
    ): Promise<Appointment[]> {
        return this.appointmentsService.findAllInRange({
            from: query.from ? new Date(query.from) : undefined,
            to: query.to ? new Date(query.to) : undefined,
            employeeId: query.employeeId,
        });
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Client, Role.Employee, Role.Admin)
    @Post()
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Create appointment',
        description:
            'Employees or admins must specify clientId in the request body.',
    })
    @ApiResponse({ status: 201, description: 'Appointment created' })
    @ApiResponse({
        status: 400,
        description:
            'clientId must be provided when creating appointments as staff',
    })
    create(
        @Body() body: CreateAppointmentDto,
        @CurrentUser() user: { userId: number; role: Role },
    ): Promise<Appointment> {
        if (
            (user.role === Role.Employee || user.role === Role.Admin) &&
            !body.clientId
        ) {
            throw new BadRequestException(
                'clientId must be provided when creating appointments as staff',
            );
        }

        const client =
            body.clientId &&
            (user.role === Role.Employee || user.role === Role.Admin)
                ? ({ id: body.clientId } as User)
                : ({ id: user.userId } as User);
        return this.appointmentsService.create(
            {
                client,
                employee: { id: body.employeeId } as User,
                service: { id: body.serviceId } as SalonService,
                startTime: new Date(body.startTime),
            },
            { id: user.userId } as User,
        );
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Client, Role.Employee, Role.Admin)
    @Get('me')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get appointments for current user' })
    @ApiResponse({ status: 200, type: Appointment, isArray: true })
    findMine(@CurrentUser() user: { userId: number }): Promise<Appointment[]> {
        return this.appointmentsService.findForUser(user.userId);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Client, Role.Employee, Role.Admin)
    @Patch(':id/cancel')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Cancel appointment' })
    @ApiResponse({
        status: 200,
        description: 'Appointment cancelled',
        type: Appointment,
    })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    @ApiResponse({ status: 404, description: 'Appointment not found' })
    async cancel(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser() user: { userId: number; role: Role },
    ): Promise<Appointment | null> {
        const appointment = await this.appointmentsService.findOne(id);
        if (!appointment) {
            throw new NotFoundException();
        }
        if (
            user.role !== Role.Admin &&
            appointment.client.id !== user.userId &&
            appointment.employee.id !== user.userId
        ) {
            throw new ForbiddenException();
        }
        return this.appointmentsService.cancel(id, { id: user.userId } as User);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Employee, Role.Admin)
    @Patch(':id/complete')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Complete appointment' })
    @ApiResponse({
        status: 200,
        description: 'Appointment completed',
        type: Appointment,
    })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    @ApiResponse({ status: 404, description: 'Appointment not found' })
    async complete(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser() user: { userId: number; role: Role },
    ): Promise<Appointment | null> {
        const appointment = await this.appointmentsService.findOne(id);
        if (!appointment) {
            throw new NotFoundException();
        }
        if (
            user.role !== Role.Admin &&
            appointment.employee.id !== user.userId
        ) {
            throw new ForbiddenException();
        }
        return this.appointmentsService.completeAppointment(id, {
            id: user.userId,
        } as User);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin)
    @Patch(':id')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update appointment (reschedule start time)' })
    @ApiResponse({
        status: 200,
        description: 'Appointment updated',
        type: Appointment,
    })
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() body: UpdateAppointmentDto,
        @CurrentUser() user: { userId: number; role: Role },
    ): Promise<Appointment | null> {
        const updated = await this.appointmentsService.updateStartTime(
            id,
            new Date(body.startTime),
            { id: user.userId } as User,
        );
        if (!updated) throw new NotFoundException();
        return updated;
    }
}
