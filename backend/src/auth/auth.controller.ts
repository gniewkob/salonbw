import { ApiErrorResponses } from '../common/decorators/api-error-responses.decorator';
import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiCreatedResponse,
    ApiOkResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterClientDto } from './dto/register-client.dto';
import { AuthTokensDto } from './dto/auth-tokens.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { SocialLoginDto } from './dto/social-login.dto';
import { SocialLoginResponseDto } from './dto/social-login-response.dto';
import { LocalAuthGuard } from './local-auth.guard';
import { Public } from './public.decorator';
import { Role } from '../users/role.enum';
import { EmployeeRole } from '../employees/employee-role.enum';
import { Request as ExpressRequest } from 'express';

interface AuthRequest extends ExpressRequest {
    user: { id: number; role: Role | EmployeeRole };
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('login')
    @Public()
    @UseGuards(LocalAuthGuard)
    @ApiOperation({ summary: 'Login with email and password' })
    @ApiCreatedResponse({
        description: 'JWT access and refresh tokens',
        type: AuthTokensDto,
    })
    @ApiErrorResponses()
    login(@Request() req: AuthRequest): Promise<AuthTokensDto> {
        return this.authService.generateTokens(req.user.id, req.user.role);
    }

    @Post('register')
    @Public()
    @ApiOperation({ summary: 'Register a new client account' })
    @ApiCreatedResponse({
        description: 'JWT access and refresh tokens',
        type: AuthTokensDto,
    })
    @ApiErrorResponses()
    register(@Body() registerDto: RegisterClientDto): Promise<AuthTokensDto> {
        return this.authService.registerClient(registerDto);
    }

    @Post('social-login')
    @Public()
    @ApiOperation({ summary: 'Login or register using social provider token' })
    @ApiOkResponse({
        description: 'JWT tokens and user data',
        type: SocialLoginResponseDto,
    })
    @ApiCreatedResponse({
        description: 'JWT tokens and user data',
        type: SocialLoginResponseDto,
    })
    @ApiErrorResponses()
    async socialLogin(
        @Body() dto: SocialLoginDto,
        @Request() req,
    ): Promise<SocialLoginResponseDto> {
        const { tokens, user, isNew } = await this.authService.socialLogin(dto);
        const result = {
            ...tokens,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
            },
        };
        (req.res as any).status(isNew ? 201 : 200);
        return result;
    }

    @Post('refresh')
    @Public()
    @ApiOperation({ summary: 'Refresh expired access token' })
    @ApiCreatedResponse({
        description: 'New access and refresh tokens',
        type: AuthTokensDto,
    })
    @ApiErrorResponses()
    refresh(@Body() dto: RefreshTokenDto): Promise<AuthTokensDto> {
        return this.authService.refresh(dto.refresh_token);
    }
}
