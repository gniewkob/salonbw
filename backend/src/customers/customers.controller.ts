import { Controller, Get, Param, NotFoundException, UseGuards } from '@nestjs/common';
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
@Roles(Role.Admin, EmployeeRole.RECEPCJA)
export class CustomersController {
    constructor(private readonly service: CustomersService) {}

    @Get()
    async list() {
        const customers = await this.service.findAll();
        return customers.map((c) => {
            const { password, refreshToken, ...rest } = c as any;
            return rest;
        });
    }

    @Get(':id')
    async get(@Param('id') id: string) {
        const customer = await this.service.findOne(Number(id));
        if (!customer) {
            throw new NotFoundException();
        }
        const { password, refreshToken, ...rest } = customer as any;
        return rest;
    }
}
