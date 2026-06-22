import {
    Controller,
    Get,
    Req,
    Res,
    UseGuards,
    HttpStatus,
    HttpCode,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { RolesGuard } from '../auth/roles.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { SocialAuthService } from './social-auth.service';

@ApiTags('Auth Social')
@Controller('auth/social')
export class AuthSocialController {
    constructor(
        private readonly socialAuthService: SocialAuthService,
        private readonly config: ConfigService,
    ) {}

    /**
     * Absolute URL on the panel to land on after a social login. The OAuth
     * callback runs on the API domain, so a relative path would resolve to
     * the API — it must be the full panel URL. Cookies are Domain=.salon-bw.pl
     * (SSO), so the panel sees the session set here. The `redirect` query
     * param can't survive the OAuth round-trip (Google calls a fixed callback),
     * so we always land on the panel dashboard; the panel routes the client on.
     */
    private successUrl(): string {
        const base =
            this.config.get<string>('PANEL_URL') || 'https://panel.salon-bw.pl';
        return `${base.replace(/\/$/, '')}/dashboard`;
    }

    private failureUrl(): string {
        const base =
            this.config.get<string>('PANEL_URL') || 'https://panel.salon-bw.pl';
        return `${base.replace(/\/$/, '')}/auth/login?error=social`;
    }

    @Get('google')
    @ApiOperation({ summary: 'Initiate Google OAuth login' })
    @ApiQuery({
        name: 'redirect',
        required: false,
        description: 'Redirect URL after login',
    })
    @UseGuards(AuthGuard('google'))
    googleAuth() {
        // Guard redirects to Google
    }

    @Get('google/callback')
    @ApiOperation({ summary: 'Google OAuth callback' })
    @ApiQuery({
        name: 'redirect',
        required: false,
        description: 'Redirect URL after login',
    })
    @ApiResponse({ status: 302, description: 'Redirects to frontend' })
    @UseGuards(AuthGuard('google'))
    async googleAuthCallback(@Req() req: Request, @Res() res: Response) {
        try {
            await this.socialAuthService.handleSocialLogin(req, res, 'google');
            res.redirect(this.successUrl());
        } catch {
            res.redirect(this.failureUrl());
        }
    }

    @Get('facebook')
    @ApiOperation({ summary: 'Initiate Facebook OAuth login' })
    @ApiQuery({
        name: 'redirect',
        required: false,
        description: 'Redirect URL after login',
    })
    @UseGuards(AuthGuard('facebook'))
    facebookAuth() {
        // Guard redirects to Facebook
    }

    @Get('facebook/callback')
    @ApiOperation({ summary: 'Facebook OAuth callback' })
    @ApiQuery({
        name: 'redirect',
        required: false,
        description: 'Redirect URL after login',
    })
    @ApiResponse({ status: 302, description: 'Redirects to frontend' })
    @UseGuards(AuthGuard('facebook'))
    async facebookAuthCallback(@Req() req: Request, @Res() res: Response) {
        try {
            await this.socialAuthService.handleSocialLogin(
                req,
                res,
                'facebook',
            );
            res.redirect(this.successUrl());
        } catch {
            res.redirect(this.failureUrl());
        }
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
