import { ApiErrorResponses } from '../../common/decorators/api-error-responses.decorator';
import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { Role } from '../../users/role.enum';
import { ProductsService } from '../products.service';

@ApiTags('Products')
@ApiBearerAuth()
@Controller('products/employee')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Employee)
export class EmployeeController {
    constructor(private readonly service: ProductsService) {}

    @Get()
    @ApiOperation({ summary: 'List products for employee' })
    @ApiResponse({ status: 200 })
    @ApiErrorResponses()
    list() {
        return this.service.findAll();
    }
}
