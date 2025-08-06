import { ApiErrorResponses } from '../common/decorators/api-error-responses.decorator';
import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../users/role.enum';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';

@ApiTags('Sales')
@ApiBearerAuth()
@Controller('sales')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SalesController {
    constructor(private readonly service: SalesService) {}

    @Post()
    @Roles(Role.Admin, Role.Employee)
    @ApiOperation({ summary: 'Create sale' })
    @ApiResponse({ status: 201 })
    @ApiErrorResponses()
    create(@Body() dto: CreateSaleDto) {
        return this.service.create(
            dto.clientId,
            dto.employeeId,
            dto.productId,
            dto.quantity,
            dto.appointmentId,
        );
    }
}
