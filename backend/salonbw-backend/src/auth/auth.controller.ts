import {
    Body,
    Controller,
    HttpCode,
    HttpStatus,
    Post,
    Request,
    UnauthorizedException,
    UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Request as ExpressRequest } from 'express';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';
import { CurrentUser } from './current-user.decorator';
import { LogService } from '../logs/log.service';
import { LogAction } from '../logs/log-action.enum';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly usersService: UsersService,
        private readonly logService: LogService,
    ) {}

    @UseGuards(AuthGuard('local'))
    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Log in user' })
    @ApiResponse({ status: 200, description: 'Tokens successfully generated' })
    async login(@CurrentUser() user: Omit<User, 'password'>) {
        const result = this.authService.login(user);
        try {
            await this.logService.logAction(
                user as User,
                LogAction.USER_LOGIN,
                {
                    userId: user.id,
                },
            );
        } catch (error) {
            console.error('Failed to log user login action', error);
        }
        return result;
    }

    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Register new user' })
    @ApiResponse({ status: 201, description: 'User successfully registered' })
    async register(@Body() dto: RegisterDto) {
        const user = await this.usersService.createUser(dto);
        const result = this.authService.login(user);
        try {
            await this.logService.logAction(user, LogAction.USER_REGISTERED, {
                userId: user.id,
            });
        } catch (error) {
            console.error('Failed to log user registration action', error);
        }
        return result;
    }

    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Refresh access token' })
    @ApiResponse({ status: 200, description: 'Tokens successfully refreshed' })
    refresh(
        @Body() dto: RefreshTokenDto,
        @Request()
        req: ExpressRequest & { cookies?: Record<string, string | undefined> },
    ) {
        const cookieToken = req.cookies
            ? (req.cookies as Record<string, string>).refreshToken
            : undefined;
        const token = dto.refreshToken ?? cookieToken;
        if (!token) {
            throw new UnauthorizedException('Refresh token not provided');
        }
        return this.authService.refresh(token);
    }
}
