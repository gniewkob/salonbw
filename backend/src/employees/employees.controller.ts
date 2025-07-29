import {
    Controller,
    Get,
    Param,
    NotFoundException,
    ParseIntPipe,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { EmployeesService } from './employees.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../users/role.enum';

@ApiTags('Employees')
@ApiBearerAuth()
@Controller('employees')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin)
export class EmployeesController {
    constructor(private readonly service: EmployeesService) {}

    @Get()
    list() {
        return this.service.findAll();
    }

    @Get(':id')
    async get(@Param('id', ParseIntPipe) id: number) {
        const employee = await this.service.findOne(id);
        if (!employee) {
            throw new NotFoundException();
        }
        return employee;
    }
}
