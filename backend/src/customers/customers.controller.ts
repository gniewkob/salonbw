import {
    Controller,
    Get,
    Param,
    NotFoundException,
    UseGuards,
    ParseIntPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../users/role.enum';
import { EmployeeRole } from '../employees/employee-role.enum';

@ApiTags('Customers')
@ApiBearerAuth()
@Controller('customers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin, EmployeeRole.RECEPTIONIST)
export class CustomersController {
    constructor(private readonly service: CustomersService) {}

    @Get()
    async list() {
        return this.service.findAll();
    }

    @Get(':id')
    async get(@Param('id', ParseIntPipe) id: number) {
        const customer = await this.service.findOne(id);
        if (!customer) {
            throw new NotFoundException();
        }
        return customer;
    }
}
