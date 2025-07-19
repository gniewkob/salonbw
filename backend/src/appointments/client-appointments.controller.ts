import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
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
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

@ApiTags('Appointments')
@ApiBearerAuth()
@Controller('appointments/client')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Client)
export class ClientAppointmentsController {
    constructor(private readonly service: AppointmentsService) {}

    @Get()
    @ApiOperation({ summary: 'List appointments for logged in client' })
    @ApiResponse({ status: 200 })
    list(@Request() req) {
        return this.service.findClientAppointments(req.user.id);
    }

    @Post()
    @ApiOperation({ summary: 'Create new appointment for client' })
    @ApiResponse({ status: 201 })
    create(
        @Request() req,
        @Body() dto: Omit<CreateAppointmentDto, 'clientId'>,
    ) {
        return this.service.create(
            req.user.id,
            dto.employeeId,
            dto.serviceId,
            dto.startTime,
        );
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update client appointment' })
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

    @Patch(':id/cancel')
    @ApiOperation({ summary: 'Cancel client appointment' })
    cancel(@Param('id') id: number, @Request() req) {
        return this.service.cancel(Number(id), req.user.id, req.user.role);
    }

    @Patch(':id/complete')
    @ApiOperation({ summary: 'Complete client appointment' })
    complete(@Param('id') id: number, @Request() req) {
        return this.service.complete(Number(id), req.user.id, req.user.role);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete client appointment' })
    remove(@Param('id') id: number, @Request() req) {
        return this.service.removeForUser(Number(id), req.user.id, Role.Client);
    }
}
