import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

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
                    const data = request as any;
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                    return (
                        data?.cookies?.refreshToken || data?.body?.refreshToken
                    );
                },
            ]),
            secretOrKey: secret,
            passReqToCallback: true,
        });
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    async validate(req: Request, payload: any) {
        const data = req as any;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return {
            ...payload,
            refreshToken: data.cookies?.refreshToken || data.body?.refreshToken,
        };
    }
}
