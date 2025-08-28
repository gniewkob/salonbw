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

class CreateClientDto {
    @IsString()
    @MinLength(1)
    name!: string;
}

@ApiTags('clients')
@Controller('clients')
export class ClientsController {
    constructor(private readonly usersService: UsersService) {}

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin)
    @Get()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'List clients' })
    list() {
        return this.usersService.findAllByRole(Role.Client);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin)
    @Post()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create client (placeholder email/password)' })
    @ApiResponse({ status: 201 })
    async create(@Body() dto: CreateClientDto) {
        const email = this.genEmail(dto.name, 'client');
        const password = this.genPassword();
        return this.usersService.createUserWithRole(
            { email, password, name: dto.name },
            Role.Client,
        );
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin)
    @Put(':id')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update client name' })
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: CreateClientDto,
    ) {
        return this.usersService.updateName(id, dto.name);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin)
    @Delete(':id')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete client' })
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
