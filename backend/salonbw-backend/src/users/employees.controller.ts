import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Post,
    Put,
    UseGuards,
    BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { Role } from './role.enum';
import { UsersService } from './users.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from '../appointments/appointment.entity';
import { LogService } from '../logs/log.service';
import { LogAction } from '../logs/log-action.enum';
import { User } from './user.entity';

class CreateEmployeeDto {
    @IsString()
    @MinLength(1)
    firstName!: string;
    @IsString()
    @MinLength(1)
    lastName!: string;
}

@ApiTags('employees')
@Controller('employees')
export class EmployeesController {
    constructor(
        private readonly usersService: UsersService,
        private readonly logService: LogService,
        @InjectRepository(Appointment)
        private readonly appointments: Repository<Appointment>,
    ) {}

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin)
    @Get()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'List employees (adds fullName field)' })
    async list() {
        const users = await this.usersService.findAllByRole(Role.Employee);
        return users.map((u) => ({
            ...u,
            fullName: u.name,
            firstName: u.name.split(' ')[0] ?? '',
            lastName: u.name.split(' ').slice(1).join(' ') ?? '',
        }));
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin)
    @Get('staff-options')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'List all staff users for filters' })
    async staffOptions() {
        const users = await this.usersService.findAll();
        return users
            .filter((user) => user.role !== Role.Client)
            .map((user) => ({
                id: user.id,
                name: user.name,
                role: user.role,
            }));
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin)
    @Post()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create employee (placeholder email/password)' })
    @ApiResponse({ status: 201 })
    async create(@Body() dto: CreateEmployeeDto, @CurrentUser() actor?: User) {
        const name = `${dto.firstName} ${dto.lastName}`.trim();
        const email = this.genEmail(name, 'employee');
        const password = this.genPassword();
        const created = await this.usersService.createUserWithRole(
            { email, password, name },
            Role.Employee,
        );
        await this.logService.logAction(
            actor ?? null,
            LogAction.EMPLOYEE_CREATED,
            {
                employeeId: created.id,
                employeeName: created.name,
                role: created.role,
            },
        );
        return created;
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin)
    @Put(':id')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update employee name' })
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: CreateEmployeeDto,
        @CurrentUser() actor?: User,
    ) {
        const name = `${dto.firstName} ${dto.lastName}`.trim();
        return this.usersService.updateName(id, name).then(async (updated) => {
            await this.logService.logAction(
                actor ?? null,
                LogAction.EMPLOYEE_UPDATED,
                {
                    employeeId: id,
                    employeeName: name,
                },
            );
            return updated;
        });
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin)
    @Delete(':id')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete employee' })
    async remove(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser() actor?: User,
    ) {
        const employee = await this.usersService.findById(id);
        const count = await this.appointments.count({
            where: [{ employee: { id } }],
        });
        if (count > 0) {
            throw new BadRequestException(
                'Cannot delete an employee with related appointments',
            );
        }
        await this.usersService.remove(id);
        await this.logService.logAction(
            actor ?? null,
            LogAction.EMPLOYEE_DELETED,
            {
                employeeId: id,
                employeeName: employee?.name ?? null,
            },
        );
        return { success: true };
    }

    private genEmail(name: string, prefix: string): string {
        const slug = name
            .trim()
            .toLowerCase()
            .replace(/\s+/g, '.')
            .replace(/[^a-z0-9.]/g, '');
        return `${prefix}.${slug}.${Date.now()}@local.invalid`;
    }
    private genPassword(): string {
        return (
            Math.random().toString(36).slice(2) +
            Math.random().toString(36).slice(2)
        );
    }
}
