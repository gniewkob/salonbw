import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    UseGuards,
    ParseIntPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Role } from '../users/role.enum';
import { EmployeeServicesService } from './employee-services.service';
import { EmployeeService } from './entities/employee-service.entity';
import { Service } from './service.entity';
import {
    CreateEmployeeServiceDto,
    UpdateEmployeeServiceDto,
    AssignEmployeesToServiceDto,
    AssignServicesToEmployeeDto,
} from './dto/employee-service.dto';

@ApiTags('employee-services')
@Controller('employee-services')
export class EmployeeServicesController {
    constructor(
        private readonly employeeServicesService: EmployeeServicesService,
    ) {}

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin, Role.Receptionist)
    @Get('employee/:employeeId')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get all service assignments for an employee' })
    @ApiResponse({ status: 200, type: EmployeeService, isArray: true })
    findByEmployee(
        @Param('employeeId', ParseIntPipe) employeeId: number,
    ): Promise<EmployeeService[]> {
        return this.employeeServicesService.findByEmployee(employeeId);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Client, Role.Employee, Role.Admin, Role.Receptionist)
    @Get('employee/:employeeId/services')
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Get services available for an employee (with custom prices)',
    })
    @ApiResponse({ status: 200, type: Service, isArray: true })
    findServicesForEmployee(
        @Param('employeeId', ParseIntPipe) employeeId: number,
    ): Promise<Service[]> {
        return this.employeeServicesService.findServicesForEmployee(employeeId);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin, Role.Receptionist)
    @Get('service/:serviceId')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get all employee assignments for a service' })
    @ApiResponse({ status: 200, type: EmployeeService, isArray: true })
    findByService(
        @Param('serviceId', ParseIntPipe) serviceId: number,
    ): Promise<EmployeeService[]> {
        return this.employeeServicesService.findByService(serviceId);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin)
    @Post()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create employee-service assignment' })
    @ApiResponse({ status: 201, type: EmployeeService })
    create(@Body() dto: CreateEmployeeServiceDto): Promise<EmployeeService> {
        return this.employeeServicesService.create(dto);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin)
    @Post('service/:serviceId/assign-employees')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Bulk assign employees to a service' })
    @ApiResponse({ status: 200, type: EmployeeService, isArray: true })
    assignEmployeesToService(
        @Param('serviceId', ParseIntPipe) serviceId: number,
        @Body() dto: AssignEmployeesToServiceDto,
    ): Promise<EmployeeService[]> {
        return this.employeeServicesService.assignEmployeesToService(
            serviceId,
            dto,
        );
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin)
    @Post('employee/:employeeId/assign-services')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Bulk assign services to an employee' })
    @ApiResponse({ status: 200, type: EmployeeService, isArray: true })
    assignServicesToEmployee(
        @Param('employeeId', ParseIntPipe) employeeId: number,
        @Body() dto: AssignServicesToEmployeeDto,
    ): Promise<EmployeeService[]> {
        return this.employeeServicesService.assignServicesToEmployee(
            employeeId,
            dto,
        );
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin)
    @Patch(':id')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update employee-service assignment' })
    @ApiResponse({ status: 200, type: EmployeeService })
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateEmployeeServiceDto,
    ): Promise<EmployeeService> {
        return this.employeeServicesService.update(id, dto);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin)
    @Delete(':id')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete employee-service assignment' })
    @ApiResponse({ status: 200, description: 'Assignment deleted' })
    remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
        return this.employeeServicesService.remove(id);
    }
}
