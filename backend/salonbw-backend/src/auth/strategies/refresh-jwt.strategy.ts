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
            secretOrKey: config.get<string>('JWT_REFRESH_SECRET') || 'secret',
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
