import {
    Body,
    Controller,
    Get,
    Patch,
    Post,
    UseGuards,
    Query,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
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
import { UpdateConsentDto } from './dto/update-consent.dto';
import { UserDto } from './dto/user.dto';
import { Role } from './role.enum';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

class ChangePasswordDto {
    @IsString()
    currentPassword!: string;
    @IsString()
    @MinLength(6)
    newPassword!: string;
}

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
    async getProfile(@CurrentUser() user: { userId: number; role: string }) {
        const profile = await this.usersService.findById(user.userId);
        if (!profile) {
            return user;
        }

        const { password: _password, ...safeProfile } = profile;
        void _password;
        return safeProfile;
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Client, Role.Employee, Role.Receptionist, Role.Admin)
    @SkipThrottle()
    @Patch('profile/consent')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update current user GDPR consent preferences' })
    @ApiResponse({ status: 200 })
    async updateConsent(
        @CurrentUser() user: { userId: number },
        @Body() dto: UpdateConsentDto,
    ) {
        return this.usersService.updateConsent(user.userId, dto);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Client, Role.Employee, Role.Receptionist, Role.Admin)
    @SkipThrottle()
    @Patch('profile/password')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Change own password' })
    async changePassword(
        @CurrentUser() user: { userId: number },
        @Body() dto: ChangePasswordDto,
    ) {
        await this.usersService.changePassword(
            user.userId,
            dto.currentPassword,
            dto.newPassword,
        );
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
