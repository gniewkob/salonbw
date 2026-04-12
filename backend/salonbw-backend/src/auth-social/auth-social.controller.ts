import {
    Controller,
    Get,
    UseGuards,
    Req,
    Res,
    Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import { SocialAuthService } from './social-auth.service';
import { ConfigService } from '@nestjs/config';

@Controller('auth/social')
export class AuthSocialController {
    constructor(
        private readonly socialAuthService: SocialAuthService,
        private readonly configService: ConfigService,
    ) {}

    @Get('google')
    @UseGuards(AuthGuard('google'))
    async googleAuth(@Req() req: Request) {}

    @Get('google/callback')
    @UseGuards(AuthGuard('google'))
    async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
        const tokens = this.socialAuthService.generateTokens(req.user as any);
        this.setAuthCookies(res, tokens);
        return res.redirect(this.configService.get('FRONTEND_URL') + '/auth/callback');
    }

    @Get('facebook')
    @UseGuards(AuthGuard('facebook'))
    async facebookAuth(@Req() req: Request) {}

    @Get('facebook/callback')
    @UseGuards(AuthGuard('facebook'))
    async facebookAuthRedirect(@Req() req: Request, @Res() res: Response) {
        const tokens = this.socialAuthService.generateTokens(req.user as any);
        this.setAuthCookies(res, tokens);
        return res.redirect(this.configService.get('FRONTEND_URL') + '/auth/callback');
    }

    private setAuthCookies(res: Response, tokens: { access_token: string; refresh_token: string }) {
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax' as const,
            domain: this.configService.get('COOKIE_DOMAIN'),
            path: '/',
        };

        res.cookie('accessToken', tokens.access_token, cookieOptions);
        res.cookie('refreshToken', tokens.refresh_token, {
            ...cookieOptions,
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
        res.cookie('sbw_auth', 'true', { ...cookieOptions, httpOnly: false });
    }
}
