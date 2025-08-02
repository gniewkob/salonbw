import {
    Body,
    Controller,
    Param,
    Post,
    Request,
    UseGuards,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../users/role.enum';
import { ProductUsageService } from './product-usage.service';
import { AppointmentsService } from '../appointments/appointments.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { EmployeeRole } from '../employees/employee-role.enum';
import { Request as ExpressRequest } from 'express';

interface AuthRequest extends ExpressRequest {
    user: { id: number; role: Role | EmployeeRole };
}

@ApiTags('Product Usage')
@ApiBearerAuth()
@Controller('appointments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AppointmentProductUsageController {
    constructor(
        private readonly usage: ProductUsageService,
        private readonly appointments: AppointmentsService,
    ) {}

    @Post(':id/product-usage')
    @Roles(Role.Admin, Role.Employee)
    @ApiOperation({ summary: 'Register product usage for appointment' })
    async create(
        @Param('id') id: string,
        @Body() body: { productId: number; quantity: number }[],
        @Request() req: AuthRequest,
    ) {
        const appt = await this.appointments.findOne(Number(id));
        if (!appt) {
            throw new NotFoundException();
        }
        if (req.user.role !== Role.Admin && appt.employee.id !== req.user.id) {
            throw new ForbiddenException();
        }
        return this.usage.registerUsage(Number(id), req.user.id, body);
    }
}
