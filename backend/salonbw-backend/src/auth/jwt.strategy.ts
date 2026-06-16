import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private readonly configService: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                ExtractJwt.fromAuthHeaderAsBearerToken(),
                (req) => {
                    return req?.cookies?.accessToken || null;
                },
            ]),
            secretOrKey: configService.get<string>('JWT_SECRET') as string,
        });
    }

    validate(payload: { sub: number; role: string }) {
        // Expose both `userId` (legacy convention used across controllers) and
        // `id` so guards/services that read `actor.id` (e.g. timetable
        // self-management) resolve the current user correctly.
        return { userId: payload.sub, id: payload.sub, role: payload.role };
    }
}
