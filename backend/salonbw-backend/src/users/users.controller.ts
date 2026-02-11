import { Body, Controller, Get, Post, UseGuards, Query } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { SkipThrottle } from '@nestjs/throttler';
import { CurrentUser } from '../auth/current-user.decorator';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserDto } from './dto/user.dto';
import { Role } from './role.enum';
import { IsEnum, IsOptional } from 'class-validator';

class ListUsersQuery {
    @IsOptional()
    @IsEnum(Role)
    role?: Role;
}

@ApiTags('Users')
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Client, Role.Employee, Role.Receptionist, Role.Admin)
    @SkipThrottle()
    @Get('profile')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get current user profile' })
    @ApiResponse({ status: 200, description: 'Current user profile' })
    getProfile(@CurrentUser() user: { userId: number; role: string }) {
        return user;
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin)
    @Get()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'List users (optionally filter by role)' })
    @ApiResponse({ status: 200, type: UserDto, isArray: true })
    async findAll(@Query() q: ListUsersQuery): Promise<UserDto[]> {
        const users = await this.usersService.findAllByRole(q.role);
        return users.map(({ password: _password, ...rest }) => {
            void _password;
            return rest;
        });
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin)
    @Post()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create user' })
    @ApiResponse({ status: 201, description: 'User created', type: UserDto })
    async create(@Body() createUserDto: CreateUserDto) {
        const user = await this.usersService.createUser(createUserDto);
        const { password: _password, ...result } = user;
        void _password;
        return result;
    }
}
