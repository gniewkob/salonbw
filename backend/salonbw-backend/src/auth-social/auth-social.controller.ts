import { Controller, Get, Req, Res, UseGuards, Query, HttpStatus, HttpCode } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { SocialAuthService } from './social-auth.service';


@ApiTags('Auth Social')
@Controller('auth/social')
export class AuthSocialController {
    constructor(private readonly socialAuthService: SocialAuthService) {}

    @Get('google')
    @ApiOperation({ summary: 'Initiate Google OAuth login' })
    @ApiQuery({ name: 'redirect', required: false, description: 'Redirect URL after login' })
    @UseGuards(AuthGuard('google'))
    googleAuth() {
        // Guard redirects to Google
    }

    @Get('google/callback')
    @ApiOperation({ summary: 'Google OAuth callback' })
    @ApiQuery({ name: 'redirect', required: false, description: 'Redirect URL after login' })
    @ApiResponse({ status: 302, description: 'Redirects to frontend' })
    @UseGuards(AuthGuard('google'))
    async googleAuthCallback(
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
        @Query('redirect') redirect?: string,
    ) {
        const result = await this.socialAuthService.handleSocialLogin(req, res, 'google', redirect);
        return { url: result.redirectUrl };
    }

    @Get('facebook')
    @ApiOperation({ summary: 'Initiate Facebook OAuth login' })
    @ApiQuery({ name: 'redirect', required: false, description: 'Redirect URL after login' })
    @UseGuards(AuthGuard('facebook'))
    facebookAuth() {
        // Guard redirects to Facebook
    }

    @Get('facebook/callback')
    @ApiOperation({ summary: 'Facebook OAuth callback' })
    @ApiQuery({ name: 'redirect', required: false, description: 'Redirect URL after login' })
    @ApiResponse({ status: 302, description: 'Redirects to frontend' })
    @UseGuards(AuthGuard('facebook'))
    async facebookAuthCallback(
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
        @Query('redirect') redirect?: string,
    ) {
        const result = await this.socialAuthService.handleSocialLogin(req, res, 'facebook', redirect);
        return { url: result.redirectUrl };
    }

    @Get('me')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get linked social accounts' })
    @ApiResponse({ status: 200, description: 'Returns linked social accounts' })
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    async getProfile(@Req() req: Request & { user: { userId: number } }) {
        return this.socialAuthService.getLinkedSocialAccounts(req.user.userId);
    }
}
