import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { User } from '../users/user.entity';
import { Request as ExpressRequest } from 'express';

interface AuthRequest extends ExpressRequest {
    body: {
        captchaToken?: string;
        [key: string]: unknown;
    };
}

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
    constructor(private readonly authService: AuthService) {
        super({ usernameField: 'email' });
    }

    async validate(
        email: string,
        password: string,
        request?: AuthRequest,
    ): Promise<Omit<User, 'password'>> {
        // Get client IP address from request
        let ip = '0.0.0.0';
        let captchaToken: string | undefined;

        if (request) {
            const connection = (request as ExpressRequest & { connection?: { remoteAddress?: string } }).connection;
            ip =
                request.ip ||
                connection?.remoteAddress ||
                '0.0.0.0';
            captchaToken = request.body?.captchaToken;
        }

        const user = await this.authService.validateUser(
            email,
            password,
            String(ip),
            captchaToken,
        );

        if (!user) {
            throw new UnauthorizedException();
        }

        return user;
    }
}
