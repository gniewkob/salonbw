import { ApiErrorResponses } from '../common/decorators/api-error-responses.decorator';
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
    Request,
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
import { CreateEmployeeResponseDto } from './dto/create-employee-response.dto';
import { UpdateEmployeeProfileDto } from './dto/update-employee-profile.dto';
import { Request as ExpressRequest } from 'express';

interface AuthRequest extends ExpressRequest {
    user: { id: number };
}

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
    @ApiErrorResponses()
    list() {
        return this.service.findAll();
    }

    @Get('me')
    @Roles(Role.Employee)
    @ApiOperation({ summary: 'Get own employee profile' })
    @ApiResponse({ status: 200 })
    @ApiErrorResponses()
    async getMe(@Request() req: AuthRequest) {
        const employee = await this.service.findMe(req.user.id);
        if (!employee) {
            throw new NotFoundException();
        }
        return employee;
    }

    @Patch('me')
    @Roles(Role.Employee)
    @ApiOperation({ summary: 'Update own employee profile' })
    @ApiResponse({ status: 200 })
    @ApiErrorResponses()
    async updateMe(
        @Request() req: AuthRequest,
        @Body() dto: UpdateEmployeeProfileDto,
    ) {
        return this.service.updateProfile(req.user.id, dto);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get employee by id' })
    @ApiResponse({ status: 200 })
    @ApiErrorResponses()
    @ApiResponse({ status: 404 })
    @ApiErrorResponses()
    async get(@Param('id', ParseIntPipe) id: number) {
        const employee = await this.service.findOne(id);
        if (!employee) {
            throw new NotFoundException();
        }
        return employee;
    }

    @Post()
    @ApiOperation({ summary: 'Create employee' })
    @ApiResponse({
        status: 201,
        description:
            'Employee created. The plaintext password is returned only in this response.',
        type: CreateEmployeeResponseDto,
    })
    @ApiErrorResponses()
    create(
        @Body() dto: CreateEmployeeDto,
        @Request() req: AuthRequest,
    ): Promise<CreateEmployeeResponseDto> {
        return this.service.create(dto, req.user.id);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update employee profile' })
    @ApiResponse({ status: 200 })
    @ApiErrorResponses()
    @ApiResponse({ status: 404 })
    @ApiErrorResponses()
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateEmployeeDto,
        @Request() req: AuthRequest,
    ) {
        const employee = await this.service.update(id, dto, req.user.id);
        if (!employee) {
            throw new NotFoundException();
        }
        return employee;
    }

    @Patch(':id/activate')
    @ApiOperation({ summary: 'Activate employee account' })
    @ApiResponse({ status: 200 })
    @ApiErrorResponses()
    @ApiResponse({ status: 404 })
    @ApiErrorResponses()
    async activate(
        @Param('id', ParseIntPipe) id: number,
        @Request() req: AuthRequest,
    ) {
        const employee = await this.service.setActive(id, true, req.user.id);
        if (!employee) {
            throw new NotFoundException();
        }
        return employee;
    }

    @Patch(':id/deactivate')
    @ApiOperation({ summary: 'Deactivate employee account' })
    @ApiResponse({ status: 200 })
    @ApiErrorResponses()
    @ApiResponse({ status: 404 })
    @ApiErrorResponses()
    async deactivate(
        @Param('id', ParseIntPipe) id: number,
        @Request() req: AuthRequest,
    ) {
        const employee = await this.service.setActive(id, false, req.user.id);
        if (!employee) {
            throw new NotFoundException();
        }
        return employee;
    }

    @Patch(':id/commission')
    @Roles(Role.Admin)
    @ApiOperation({ summary: 'Update employee commission percentage' })
    @ApiResponse({ status: 200 })
    @ApiErrorResponses()
    @ApiResponse({ status: 404 })
    @ApiErrorResponses()
    async updateCommission(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateEmployeeCommissionDto,
        @Request() req: AuthRequest,
    ) {
        const employee = await this.service.setCommissionBase(
            id,
            dto.commissionBase,
            req.user.id,
        );
        if (!employee) {
            throw new NotFoundException();
        }
        return employee;
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Soft delete employee' })
    @ApiResponse({ status: 200 })
    @ApiErrorResponses()
    @ApiResponse({ status: 404 })
    @ApiErrorResponses()
    async remove(
        @Param('id', ParseIntPipe) id: number,
        @Request() req: AuthRequest,
    ) {
        const removed = await this.service.remove(id, req.user.id);
        if (!removed) {
            throw new NotFoundException();
        }
        return { success: true };
    }
}
