import {
    Body,
    Controller,
    HttpCode,
    HttpStatus,
    Post,
    Request,
    UnauthorizedException,
    UseGuards,
    Response,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import type {
    Request as ExpressRequest,
    Response as ExpressResponse,
} from 'express';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RefreshJwtGuard } from './guards/refresh-jwt.guard';
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
    @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 attempts per minute
    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Log in user' })
    @ApiResponse({ status: 200, description: 'Tokens successfully generated' })
    async login(
        @CurrentUser() user: Omit<User, 'password'>,
        @Response({ passthrough: true }) res: ExpressResponse,
    ) {
        const result = await this.authService.login(user, res);
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
    @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 attempts per minute
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Register new user' })
    @ApiResponse({ status: 201, description: 'User successfully registered' })
    async register(
        @Body() dto: RegisterDto,
        @Response({ passthrough: true }) res: ExpressResponse,
    ) {
        const user = await this.usersService.createUser(dto);
        const result = await this.authService.login(user, res);
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
    @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 attempts per minute
    @HttpCode(HttpStatus.OK)
    @UseGuards(RefreshJwtGuard)
    @ApiOperation({ summary: 'Refresh access token' })
    @ApiResponse({ status: 200, description: 'Tokens successfully refreshed' })
    refresh(
        @Body() dto: RefreshTokenDto,
        @Response({ passthrough: true }) res: ExpressResponse,
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
        return this.authService.refresh(token, res);
    }
}
