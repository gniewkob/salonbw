import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import type { User } from '../../users/user.entity';

type RefreshJwtPayload = {
    sub: number;
    role: User['role'];
    jti?: string;
};

type RefreshJwtUser = RefreshJwtPayload & {
    refreshToken: string | null;
};

const getStringProperty = (container: unknown, key: string): string | null => {
    if (typeof container !== 'object' || container === null) {
        return null;
    }
    const value = (container as Record<string, unknown>)[key];
    return typeof value === 'string' ? value : null;
};

const getRefreshToken = (request: Request): string | null =>
    getStringProperty(request.cookies, 'refreshToken') ??
    getStringProperty(request.body, 'refreshToken');

@Injectable()
export class RefreshJwtStrategy extends PassportStrategy(
    Strategy,
    'jwt-refresh',
) {
    constructor(config: ConfigService) {
        const secret = config.get<string>('JWT_REFRESH_SECRET');
        if (!secret) {
            throw new Error(
                'JWT_REFRESH_SECRET is not set — refusing to start with insecure default',
            );
        }
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                (request: Request) => {
                    return getRefreshToken(request);
                },
            ]),
            secretOrKey: secret,
            passReqToCallback: true,
        });
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    async validate(
        req: Request,
        payload: RefreshJwtPayload,
    ): Promise<RefreshJwtUser> {
        return {
            ...payload,
            refreshToken: getRefreshToken(req),
        };
    }
}
