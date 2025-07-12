import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterClientDto } from './dto/register-client.dto';
import { AuthTokensDto } from './dto/auth-tokens.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LocalAuthGuard } from './local-auth.guard';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('login')
    @UseGuards(LocalAuthGuard)
    login(@Request() req): Promise<AuthTokensDto> {
        return this.authService.generateTokens(req.user.id, req.user.role);
    }

    @Post('register')
    register(@Body() registerDto: RegisterClientDto): Promise<AuthTokensDto> {
        return this.authService.registerClient(registerDto);
    }

    @Post('refresh')
    refresh(@Body() dto: RefreshTokenDto): Promise<AuthTokensDto> {
        return this.authService.refresh(dto.refresh_token);
    }
}
