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

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly usersService: UsersService,
    ) {}

    @UseGuards(AuthGuard('local'))
    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Log in user' })
    @ApiResponse({ status: 200, description: 'Tokens successfully generated' })
    login(@Request() req: ExpressRequest & { user: Omit<User, 'password'> }) {
        return this.authService.login(req.user);
    }

    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Register new user' })
    @ApiResponse({ status: 201, description: 'User successfully registered' })
    async register(@Body() dto: RegisterDto) {
        const user = await this.usersService.createUser(dto);
        return this.authService.login(user);
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
