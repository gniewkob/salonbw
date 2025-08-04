import {
    Body,
    Controller,
    Param,
    Post,
    Request,
    UseGuards,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../users/role.enum';
import { ProductUsageService } from './product-usage.service';
import { AppointmentsService } from '../appointments/appointments.service';
import { SalesService } from '../sales/sales.service';
import {
    ApiBearerAuth,
    ApiBody,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { EmployeeRole } from '../employees/employee-role.enum';
import { Request as ExpressRequest } from 'express';
import { ProductUsageEntryDto } from './dto/product-usage-entry.dto';
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
        private readonly sales: SalesService,
    ) {}

    @Post(':id/product-usage')
    @Roles(Role.Admin, Role.Employee)
    @ApiOperation({
        summary: 'Register product usage for appointment',
        description:
            'Records consumption of products. The usageType defaults to INTERNAL when not provided.',
    })
    @ApiResponse({ status: 201 })
    @ApiResponse({ status: 404 })
    @ApiResponse({ status: 409 })
    @ApiBody({
        type: [ProductUsageEntryDto],
        description: 'Each entry may specify a usageType; defaults to INTERNAL.',
    })
    async create(
        @Param('id') id: string,
        @Body() body: ProductUsageEntryDto[],
        @Request() req: AuthRequest,
    ) {
        const appt = await this.appointments.findOne(Number(id));
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

        const saleEntries = entries.filter(
            (e) => e.usageType === UsageType.SALE,
        );
        const usageEntries = entries.filter(
            (e) => e.usageType !== UsageType.SALE,
        );

        if (saleEntries.length > 0 && !appt.client?.id) {
            throw new BadRequestException('sale entries require client');
        }

        const sales = await Promise.all(
            saleEntries.map((e) =>
                this.sales.create(
                    appt.client.id,
                    appt.employee.id,
                    e.productId,
                    e.quantity,
                ),
            ),
        );

        const usageRecords = usageEntries.length
            ? await this.usage.registerUsage(
                  Number(id),
                  req.user.id,
                  usageEntries,
              )
            : [];

        return { sales, usage: usageRecords };
    }
}
