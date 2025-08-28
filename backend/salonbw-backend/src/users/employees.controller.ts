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
import { Role } from './role.enum';
import { UsersService } from './users.service';

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
    constructor(private readonly usersService: UsersService) {}

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
    @Post()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create employee (placeholder email/password)' })
    @ApiResponse({ status: 201 })
    async create(@Body() dto: CreateEmployeeDto) {
        const name = `${dto.firstName} ${dto.lastName}`.trim();
        const email = this.genEmail(name, 'employee');
        const password = this.genPassword();
        return this.usersService.createUserWithRole(
            { email, password, name },
            Role.Employee,
        );
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin)
    @Put(':id')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update employee name' })
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: CreateEmployeeDto,
    ) {
        const name = `${dto.firstName} ${dto.lastName}`.trim();
        return this.usersService.updateName(id, name);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin)
    @Delete(':id')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete employee' })
    async remove(@Param('id', ParseIntPipe) id: number) {
        await this.usersService.remove(id);
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
