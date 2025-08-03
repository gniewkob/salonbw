import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    NotFoundException,
    Patch,
    Post,
    Put,
    UseGuards,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { EmployeesService } from './employees.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../users/role.enum';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { UpdateEmployeeCommissionDto } from './dto/update-employee-commission.dto';

@ApiTags('Employees')
@ApiBearerAuth()
@Controller('employees')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin)
export class EmployeesController {
    constructor(private readonly service: EmployeesService) {}

    @Get()
    @ApiOperation({ summary: 'List employees' })
    @ApiResponse({ status: 200 })
    list() {
        return this.service.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get employee by id' })
    @ApiResponse({ status: 200 })
    @ApiResponse({ status: 404 })
    async get(@Param('id', ParseIntPipe) id: number) {
        const employee = await this.service.findOne(id);
        if (!employee) {
            throw new NotFoundException();
        }
        return employee;
    }

    @Post()
    @ApiOperation({ summary: 'Create employee' })
    @ApiResponse({ status: 201 })
    create(@Body() dto: CreateEmployeeDto) {
        return this.service.create(dto);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update employee profile' })
    @ApiResponse({ status: 200 })
    @ApiResponse({ status: 404 })
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateEmployeeDto,
    ) {
        const employee = await this.service.update(id, dto);
        if (!employee) {
            throw new NotFoundException();
        }
        return employee;
    }

    @Patch(':id/activate')
    @ApiOperation({ summary: 'Activate employee account' })
    @ApiResponse({ status: 200 })
    @ApiResponse({ status: 404 })
    async activate(@Param('id', ParseIntPipe) id: number) {
        const employee = await this.service.setActive(id, true);
        if (!employee) {
            throw new NotFoundException();
        }
        return employee;
    }

    @Patch(':id/deactivate')
    @ApiOperation({ summary: 'Deactivate employee account' })
    @ApiResponse({ status: 200 })
    @ApiResponse({ status: 404 })
    async deactivate(@Param('id', ParseIntPipe) id: number) {
        const employee = await this.service.setActive(id, false);
        if (!employee) {
            throw new NotFoundException();
        }
        return employee;
    }

    @Patch(':id/commission')
    @ApiOperation({ summary: 'Update employee commission base' })
    @ApiResponse({ status: 200 })
    @ApiResponse({ status: 404 })
    async updateCommission(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateEmployeeCommissionDto,
    ) {
        const employee = await this.service.setCommissionBase(
            id,
            dto.commissionBase,
        );
        if (!employee) {
            throw new NotFoundException();
        }
        return employee;
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Soft delete employee' })
    @ApiResponse({ status: 200 })
    @ApiResponse({ status: 404 })
    async remove(@Param('id', ParseIntPipe) id: number) {
        const removed = await this.service.remove(id);
        if (!removed) {
            throw new NotFoundException();
        }
        return { success: true };
    }
}
