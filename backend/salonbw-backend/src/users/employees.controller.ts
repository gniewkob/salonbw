import {
    Body,
    Controller,
    Delete,
    ForbiddenException,
    Get,
    NotFoundException,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Put,
    UseGuards,
    BadRequestException,
    HttpCode,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import {
    IsString,
    MinLength,
    IsOptional,
    IsEmail,
    IsEnum,
    IsNumber,
    Min,
    Max,
} from 'class-validator';
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

const STAFF_ROLES: Role[] = [Role.Admin, Role.Employee, Role.Receptionist];

class CreateEmployeeDto {
    @IsString()
    @MinLength(1)
    firstName!: string;
    @IsString()
    @MinLength(1)
    lastName!: string;
    @IsEmail()
    @IsOptional()
    email?: string;
    @IsString()
    @MinLength(6)
    @IsOptional()
    password?: string;
    @IsEnum(Role)
    @IsOptional()
    role?: Role;
}

class UpdateRoleDto {
    @IsEnum(Role)
    role!: Role;
}

class ResetPasswordDto {
    @IsString()
    @MinLength(6)
    newPassword!: string;
}

class UpdateCommissionBaseDto {
    // Needs a class-validator decorator: with the global ValidationPipe's
    // forbidNonWhitelisted, an undecorated property is rejected as
    // non-whitelisted → 400 "property commissionBase should not exist"
    // (broke the panel's commission-base editor).
    @IsNumber()
    @Min(0)
    @Max(100)
    commissionBase!: number;
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
    @Roles(Role.Admin, Role.Employee, Role.Receptionist)
    @Get()
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'List all staff users (employee, receptionist, admin)',
    })
    async list(@CurrentUser() actor?: { userId: number; role: Role }) {
        const users = await this.usersService.findAll();
        const staff = users.filter((u) => STAFF_ROLES.includes(u.role));
        // Non-admins (employee/receptionist) get a sanitized projection so the
        // calendar/timetable filters can list colleagues without leaking PII
        // (email, phone, commissionBase, …). Admins keep the full record.
        if (actor?.role !== Role.Admin) {
            return staff.map((u) => this.toStaffView(u));
        }
        return staff.map((u) => ({
            ...u,
            fullName: u.name,
            firstName: u.name.split(' ')[0] ?? '',
            lastName: u.name.split(' ').slice(1).join(' ') ?? '',
        }));
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin, Role.Employee, Role.Receptionist)
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
    @Roles(Role.Admin, Role.Employee, Role.Receptionist)
    @Get(':id')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get single staff user by id' })
    async getOne(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser() actor?: { userId: number; role: Role },
    ) {
        // Employees may only read their OWN record (self-service "Mój grafik").
        if (actor?.role !== Role.Admin && actor?.userId !== id) {
            throw new ForbiddenException(
                'You may only access your own employee record',
            );
        }
        const user = await this.usersService.findById(id);
        if (!user || !STAFF_ROLES.includes(user.role)) {
            return null;
        }
        if (actor?.role !== Role.Admin) {
            return this.toStaffView(user);
        }
        return {
            ...user,
            fullName: user.name,
            firstName: user.name.split(' ')[0] ?? '',
            lastName: user.name.split(' ').slice(1).join(' ') ?? '',
        };
    }

    /** Minimal, PII-free staff projection for non-admin callers. */
    private toStaffView(user: User) {
        return {
            id: user.id,
            name: user.name,
            role: user.role,
            fullName: user.name,
            firstName: user.name.split(' ')[0] ?? '',
            lastName: user.name.split(' ').slice(1).join(' ') ?? '',
        };
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin)
    @Post()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create employee (placeholder email/password)' })
    @ApiResponse({ status: 201 })
    async create(@Body() dto: CreateEmployeeDto, @CurrentUser() actor?: User) {
        const name = `${dto.firstName} ${dto.lastName}`.trim();
        const email = dto.email || this.genEmail(name, 'employee');
        const password = dto.password || this.genPassword();
        const assignedRole =
            dto.role && STAFF_ROLES.includes(dto.role)
                ? dto.role
                : Role.Employee;
        const created = await this.usersService.createUserWithRole(
            { email, password, name },
            assignedRole,
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
    @Patch(':id/role')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Change role for a staff user' })
    async changeRole(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateRoleDto,
        @CurrentUser() actor?: User,
    ) {
        if (!STAFF_ROLES.includes(dto.role)) {
            throw new BadRequestException(
                'Role must be admin, employee, or receptionist',
            );
        }
        const user = await this.usersService.findById(id);
        if (!user) throw new NotFoundException('User not found');
        const prevRole = user.role;
        const updated = await this.usersService.updateRole(id, dto.role);
        await this.logService.logAction(
            actor ?? null,
            LogAction.EMPLOYEE_ROLE_CHANGED,
            {
                employeeId: id,
                employeeName: user.name,
                prevRole,
                newRole: dto.role,
            },
        );
        return updated;
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin)
    @Patch(':id/password')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Admin reset password for a staff user' })
    async resetPassword(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: ResetPasswordDto,
        @CurrentUser() actor?: User,
    ) {
        const user = await this.usersService.findById(id);
        if (!user) throw new NotFoundException('User not found');
        await this.usersService.adminResetPassword(id, dto.newPassword);
        await this.logService.logAction(
            actor ?? null,
            LogAction.PASSWORD_RESET_BY_ADMIN,
            { employeeId: id, employeeName: user.name },
        );
        return { success: true };
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

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin)
    @Get(':id/commission-base')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get commission base rate for employee' })
    async getCommissionBase(@Param('id', ParseIntPipe) id: number) {
        const employee = await this.usersService.findById(id);
        if (!employee) throw new NotFoundException('Employee not found');
        return { commissionBase: Number(employee.commissionBase ?? 0) };
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin)
    @Patch(':id/commission-base')
    @HttpCode(200)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Set commission base rate for employee' })
    async updateCommissionBase(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateCommissionBaseDto,
        @CurrentUser() actor?: User,
    ) {
        const rate = Number(dto.commissionBase ?? 0);
        if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
            throw new BadRequestException(
                'commissionBase must be between 0 and 100',
            );
        }
        await this.usersService.updateCommissionBase(id, rate);
        await this.logService.logAction(
            actor ?? null,
            LogAction.EMPLOYEE_UPDATED,
            { employeeId: id, commissionBase: rate },
        );
        return { commissionBase: rate };
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
