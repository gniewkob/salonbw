import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterClientDto } from './dto/register-client.dto';
import { AuthTokensDto } from './dto/auth-tokens.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LocalAuthGuard } from './local-auth.guard';
import { Public } from './public.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('login')
    @Public()
    @UseGuards(LocalAuthGuard)
    @ApiOperation({ summary: 'Login with email and password' })
    @ApiResponse({ status: 201, description: 'JWT access and refresh tokens' })
    login(@Request() req): Promise<AuthTokensDto> {
        return this.authService.generateTokens(req.user.id, req.user.role);
    }

    @Post('register')
    @Public()
    @ApiOperation({ summary: 'Register a new client account' })
    @ApiResponse({ status: 201, description: 'JWT access and refresh tokens' })
    register(@Body() registerDto: RegisterClientDto): Promise<AuthTokensDto> {
        return this.authService.registerClient(registerDto);
    }

    @Post('refresh')
    @Public()
    @ApiOperation({ summary: 'Refresh expired access token' })
    @ApiResponse({ status: 201, description: 'New access and refresh tokens' })
    refresh(@Body() dto: RefreshTokenDto): Promise<AuthTokensDto> {
        return this.authService.refresh(dto.refresh_token);
    }
}
