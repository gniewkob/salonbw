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
import { SkipThrottle } from '@nestjs/throttler';
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
import { AppointmentMessageDto } from './dto/appointment-message.dto';
import { GetAppointmentsDto } from './dto/get-appointments.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';
import { FinalizeAppointmentDto } from './dto/finalize-appointment.dto';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';
import { CreateCancellationRequestDto } from './dto/create-cancellation-request.dto';
import { GetCancellationRequestsDto } from './dto/get-cancellation-requests.dto';

@ApiTags('appointments')
@Controller('appointments')
export class AppointmentsController {
    constructor(private readonly appointmentsService: AppointmentsService) {}

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin, Role.Receptionist, Role.Employee, Role.Client)
    @Get()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'List appointments with filters and pagination' })
    @ApiResponse({ status: 200, description: 'Paginated appointment list' })
    async findAll(
        @Query(new ValidationPipe({ transform: true }))
        query: GetAppointmentsDto,
        @CurrentUser() user: { userId: number; role: Role },
    ) {
        if (user.role === Role.Admin || user.role === Role.Receptionist) {
            return this.appointmentsService.findAllInRange({
                from: query.from ? new Date(query.from) : undefined,
                to: query.to ? new Date(query.to) : undefined,
                employeeId: query.employeeId,
                status: query.status,
            });
        }
        if (user.role === Role.Employee) {
            return this.appointmentsService.findAllInRange({
                from: query.from ? new Date(query.from) : undefined,
                to: query.to ? new Date(query.to) : undefined,
                employeeId: user.userId,
                status: query.status,
            });
        }
        const items = await this.appointmentsService.findForUser(user.userId);
        return { items, total: items.length, page: 1, pageSize: items.length };
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin, Role.Receptionist)
    @Get('cancellation-requests')
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'List client cancellation requests for reception queue',
    })
    @ApiResponse({ status: 200, description: 'Cancellation request queue' })
    listCancellationRequests(
        @Query(new ValidationPipe({ transform: true }))
        query: GetCancellationRequestsDto,
    ) {
        return this.appointmentsService.listCancellationRequests(
            query.limit ?? 50,
        );
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Client, Role.Employee, Role.Admin, Role.Receptionist)
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
        const isStaff =
            user.role === Role.Employee ||
            user.role === Role.Admin ||
            user.role === Role.Receptionist;

        if (isStaff && !body.clientId) {
            throw new BadRequestException(
                'clientId must be provided when creating appointments as staff',
            );
        }

        const client = isStaff
            ? ({ id: body.clientId } as User)
            : ({ id: user.userId } as User);
        return this.appointmentsService.create(
            {
                client,
                employee: { id: body.employeeId } as User,
                service: { id: body.serviceId } as SalonService,
                serviceVariantId: body.serviceVariantId,
                addonServiceIds: body.addonServiceIds,
                startTime: new Date(body.startTime),
                reservedOnline: !isStaff ? true : undefined,
                clientComment: body.clientComment?.trim()
                    ? body.clientComment.trim()
                    : undefined,
            } as Parameters<AppointmentsService['create']>[0],
            { id: user.userId } as User,
        );
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Client, Role.Employee, Role.Admin, Role.Receptionist)
    @Get('me')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get appointments for current user' })
    @ApiResponse({ status: 200 })
    async findMine(@CurrentUser() user: { userId: number }) {
        // Raw entities would serialize staff-private internalNote and money
        // fields (paidAmount/tipAmount/discount) to clients — map explicitly.
        const appointments = await this.appointmentsService.findForUser(
            user.userId,
        );
        return appointments.map((apt) => ({
            id: apt.id,
            clientId: apt.clientId,
            employeeId: apt.employeeId,
            serviceId: apt.serviceId,
            startTime: apt.startTime,
            endTime: apt.endTime,
            status: apt.status,
            clientComment: apt.clientComment ?? null,
            staffRecommendations: apt.staffRecommendations ?? null,
            onlineAddonsSummary: apt.onlineAddonsSummary ?? null,
            onlineTotalDurationMinutes: apt.onlineTotalDurationMinutes ?? null,
            onlineDurationNeedsVerification:
                apt.onlineDurationNeedsVerification ?? false,
        }));
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Client, Role.Employee, Role.Admin, Role.Receptionist)
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
        const canCancelAny =
            user.role === Role.Admin || user.role === Role.Receptionist;
        if (
            !canCancelAny &&
            appointment.client.id !== user.userId &&
            appointment.employee.id !== user.userId
        ) {
            throw new ForbiddenException();
        }
        return this.appointmentsService.cancel(id, { id: user.userId } as User);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Client)
    @Patch(':id/accept-reschedule')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Client accepts rescheduled appointment time' })
    @ApiResponse({
        status: 200,
        description: 'Reschedule accepted, appointment confirmed',
        type: Appointment,
    })
    @ApiResponse({
        status: 400,
        description: 'Appointment not awaiting acceptance',
    })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    @ApiResponse({ status: 404, description: 'Appointment not found' })
    async acceptReschedule(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser() user: { userId: number; role: Role },
    ): Promise<Appointment | null> {
        const result = await this.appointmentsService.acceptReschedule(id, {
            id: user.userId,
        } as User);
        if (!result) {
            throw new NotFoundException();
        }
        return result;
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Client)
    @Post(':id/cancellation-request')
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Create client cancellation request for appointment',
        description:
            'Records a cancellation request audit event without changing appointment status.',
    })
    @ApiResponse({
        status: 201,
        description: 'Cancellation request recorded',
        type: Appointment,
    })
    @ApiResponse({ status: 400, description: 'Invalid cancellation request' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    @ApiResponse({ status: 404, description: 'Appointment not found' })
    async requestCancellation(
        @Param('id', ParseIntPipe) id: number,
        @Body(new ValidationPipe({ transform: true }))
        body: CreateCancellationRequestDto,
        @CurrentUser() user: { userId: number; role: Role },
    ): Promise<Appointment> {
        const appointment = await this.appointmentsService.requestCancellation(
            id,
            { id: user.userId } as User,
            body.reason,
        );
        if (!appointment) {
            throw new NotFoundException();
        }
        return appointment;
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Client)
    @Post(':id/reschedule-request')
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Create client reschedule request for appointment',
        description:
            'Records a reschedule request audit event without changing appointment status.',
    })
    @ApiResponse({
        status: 201,
        description: 'Reschedule request recorded',
        type: Appointment,
    })
    @ApiResponse({ status: 400, description: 'Invalid reschedule request' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    @ApiResponse({ status: 404, description: 'Appointment not found' })
    async requestReschedule(
        @Param('id', ParseIntPipe) id: number,
        @Body() body: { reason?: string },
        @CurrentUser() user: { userId: number; role: Role },
    ): Promise<Appointment> {
        const appointment = await this.appointmentsService.requestReschedule(
            id,
            { id: user.userId } as User,
            body.reason,
        );
        if (!appointment) {
            throw new NotFoundException();
        }
        return appointment;
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
    @Roles(Role.Admin, Role.Receptionist, Role.Employee)
    @Patch(':id/status')
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Update appointment status',
        description:
            'Updates appointment status for staff-driven workflow (confirm/start/no-show/cancel/complete).',
    })
    @ApiResponse({
        status: 200,
        description: 'Appointment status updated',
        type: Appointment,
    })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    @ApiResponse({ status: 404, description: 'Appointment not found' })
    async updateStatus(
        @Param('id', ParseIntPipe) id: number,
        @Body(new ValidationPipe({ transform: true }))
        body: UpdateAppointmentStatusDto,
        @CurrentUser() user: { userId: number; role: Role },
    ): Promise<Appointment | null> {
        const appointment = await this.appointmentsService.findOne(id);
        if (!appointment) {
            throw new NotFoundException();
        }

        if (
            user.role === Role.Employee &&
            appointment.employee.id !== user.userId
        ) {
            throw new ForbiddenException(
                'Employees can only update status for their own appointments',
            );
        }

        return this.appointmentsService.updateStatus(id, body.status, {
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
            body.endTime ? new Date(body.endTime) : undefined,
            body.serviceVariantId,
            { id: user.userId } as User,
        );
        if (!updated) throw new NotFoundException();
        return updated;
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin, Role.Receptionist, Role.Employee)
    @Patch(':id/reschedule')
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Reschedule appointment (drag & drop support)',
        description:
            'Reschedule an appointment to a new time and optionally a different employee. ' +
            'Use force=true to ignore conflicts.',
    })
    @ApiResponse({
        status: 200,
        description: 'Appointment rescheduled',
        type: Appointment,
    })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    @ApiResponse({ status: 404, description: 'Appointment not found' })
    @ApiResponse({
        status: 409,
        description: 'Conflict - employee already booked for this time',
    })
    async reschedule(
        @Param('id', ParseIntPipe) id: number,
        @Body() body: RescheduleAppointmentDto,
        @CurrentUser() user: { userId: number; role: Role },
    ): Promise<Appointment | null> {
        const appointment = await this.appointmentsService.findOne(id);
        if (!appointment) {
            throw new NotFoundException();
        }

        if (
            user.role === Role.Employee &&
            appointment.employee.id !== user.userId
        ) {
            throw new ForbiddenException(
                'Employees can only reschedule their own appointments',
            );
        }

        const updated = await this.appointmentsService.reschedule(
            id,
            new Date(body.startTime),
            body.endTime ? new Date(body.endTime) : undefined,
            body.employeeId,
            body.force ?? false,
            { id: user.userId } as User,
        );

        if (!updated) {
            throw new NotFoundException();
        }

        return updated;
    }

    // Polled by the topbar badge every couple of minutes from every open panel
    // tab — a cheap authenticated COUNT that must not eat the rate-limit budget.
    @SkipThrottle()
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin, Role.Receptionist, Role.Employee)
    @Get('online-pending-count')
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Count online-pending appointments',
        description:
            'Admin and Receptionist see the total count. ' +
            'Employee sees only their own online-pending appointments.',
    })
    @ApiResponse({
        status: 200,
        description: 'Count of online-pending appointments',
        schema: { type: 'object', properties: { count: { type: 'number' } } },
    })
    async countOnlinePending(
        @CurrentUser() user: { userId: number; role: Role },
    ): Promise<{ count: number }> {
        const isEmployeeOnly = user.role === Role.Employee;
        const count = await this.appointmentsService.countOnlinePending(
            isEmployeeOnly ? user.userId : undefined,
        );
        return { count };
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin, Role.Employee)
    @Get(':id/conflicts')
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Check for scheduling conflicts',
        description:
            'Check if rescheduling an appointment would cause conflicts',
    })
    @ApiResponse({
        status: 200,
        description: 'Conflict check result',
    })
    async checkConflicts(
        @Param('id', ParseIntPipe) id: number,
        @Query('startTime') startTime: string,
        @Query('endTime') endTime: string,
        @Query('employeeId') employeeId?: string,
    ) {
        const appointment = await this.appointmentsService.findOne(id);
        if (!appointment) {
            throw new NotFoundException();
        }

        const targetEmployeeId = employeeId
            ? parseInt(employeeId, 10)
            : appointment.employee.id;

        return this.appointmentsService.checkConflicts(
            targetEmployeeId,
            new Date(startTime),
            new Date(endTime),
            id,
        );
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Employee, Role.Admin, Role.Receptionist)
    @Post(':id/finalize')
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Finalize appointment with payment details',
        description:
            'Complete the visit checkout with payment method, amounts, tips, discounts, ' +
            'and optional product sales (upselling). Creates commission records.',
    })
    @ApiResponse({
        status: 200,
        description: 'Appointment finalized successfully',
        type: Appointment,
    })
    @ApiResponse({
        status: 400,
        description: 'Invalid payment data or appointment state',
    })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    @ApiResponse({ status: 404, description: 'Appointment not found' })
    async finalize(
        @Param('id', ParseIntPipe) id: number,
        @Body(new ValidationPipe({ transform: true }))
        body: FinalizeAppointmentDto,
        @CurrentUser() user: { userId: number; role: Role },
    ): Promise<Appointment | null> {
        const appointment = await this.appointmentsService.findOne(id);
        if (!appointment) {
            throw new NotFoundException();
        }

        // Authorization: Admin/Receptionist can finalize any, Employee only their own
        if (
            user.role === Role.Employee &&
            appointment.employee.id !== user.userId
        ) {
            throw new ForbiddenException(
                'Employees can only finalize their own appointments',
            );
        }

        return this.appointmentsService.finalizeAppointment(id, body, {
            id: user.userId,
        } as User);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin, Role.Receptionist, Role.Employee)
    @Patch(':id/notes')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update internal note on appointment' })
    @ApiResponse({ status: 200, type: Appointment })
    async updateNotes(
        @Param('id', ParseIntPipe) id: number,
        @Body() body: { internalNote: string | null },
    ): Promise<Appointment> {
        return this.appointmentsService.updateNotes(id, body.internalNote);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin, Role.Receptionist, Role.Employee)
    @Patch(':id/client-note')
    @ApiBearerAuth()
    @ApiOperation({
        summary:
            'Update the client-visible visit note (read by the client on their dashboard)',
    })
    @ApiResponse({ status: 200, type: Appointment })
    async updateClientNote(
        @Param('id', ParseIntPipe) id: number,
        @Body() body: { clientComment: string | null },
    ): Promise<Appointment> {
        return this.appointmentsService.updateClientNote(
            id,
            body.clientComment,
        );
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Client, Role.Employee, Role.Admin, Role.Receptionist)
    @Get(':id/messages')
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'List the two-way message thread for an appointment',
    })
    async listMessages(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser() user: { userId: number; role: Role },
    ) {
        return this.appointmentsService.listMessages(id, user);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Client, Role.Employee, Role.Admin, Role.Receptionist)
    @Post(':id/messages')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Add a message to the appointment thread' })
    async addMessage(
        @Param('id', ParseIntPipe) id: number,
        @Body() body: AppointmentMessageDto,
        @CurrentUser() user: { userId: number; role: Role },
    ) {
        return this.appointmentsService.addMessage(id, user, body.body);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin, Role.Receptionist, Role.Employee)
    @Get(':id/usage')
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Get suggested material usage from service recipe',
    })
    @ApiResponse({
        status: 200,
        description: 'Usage suggestions derived from service recipe items',
    })
    async getUsageSuggestions(@Param('id', ParseIntPipe) id: number): Promise<
        {
            productId: number;
            productName: string;
            quantity: number;
            unit: string;
        }[]
    > {
        return this.appointmentsService.getUsageSuggestions(id);
    }
}
