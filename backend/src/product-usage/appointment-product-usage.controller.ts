import { ApiErrorResponses } from '../common/decorators/api-error-responses.decorator';
import {
    Body,
    Controller,
    Param,
    Post,
    ParseIntPipe,
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
import {
    ApiBearerAuth,
    ApiBody,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { EmployeeRole } from '../employees/employee-role.enum';
import { Request as ExpressRequest } from 'express';
import { AppointmentProductUsageEntryDto } from './dto/appointment-product-usage-entry.dto';
import { UsageType } from './usage-type.enum';

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
    @ApiOperation({
        summary: 'Register product usage for appointment',
        description:
            'Records consumption of products. The usageType defaults to INTERNAL when not provided.',
    })
    @ApiResponse({ status: 201 })
    @ApiErrorResponses()
    @ApiResponse({ status: 404 })
    @ApiErrorResponses()
    @ApiResponse({ status: 409 })
    @ApiErrorResponses()
    @ApiBody({
        type: [AppointmentProductUsageEntryDto],
        description:
            'Each entry may specify a usageType; allowed values: INTERNAL or STOCK_CORRECTION. Defaults to INTERNAL.',
    })
    async create(
        @Param('id', ParseIntPipe) id: number,
        @Body() body: AppointmentProductUsageEntryDto[],
        @Request() req: AuthRequest,
    ) {
        const appt = await this.appointments.findOne(id);
        if (!appt) {
            throw new NotFoundException();
        }
        if (req.user.role !== Role.Admin && appt.employee.id !== req.user.id) {
            throw new ForbiddenException();
        }
        const entries = body.map((entry) => ({
            ...entry,
            usageType: entry.usageType ?? UsageType.INTERNAL,
        }));

        const usageRecords = entries.length
            ? await this.usage.registerUsage(
                  id,
                  req.user.id,
                  entries,
              )
            : [];

        return { usage: usageRecords };
    }
}
