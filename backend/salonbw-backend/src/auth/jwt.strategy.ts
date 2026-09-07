import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { UsersService } from '../users/users.service';
import { Role } from '../users/role.enum';

const accessTokenFromCookie = (request: Request): string | null => {
    const cookies: unknown = request.cookies;
    if (typeof cookies !== 'object' || cookies === null) return null;
    const value = (cookies as Record<string, unknown>).accessToken;
    return typeof value === 'string' ? value : null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private readonly configService: ConfigService,
        private readonly usersService: UsersService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                ExtractJwt.fromAuthHeaderAsBearerToken(),
                accessTokenFromCookie,
            ]),
            secretOrKey: configService.get<string>('JWT_SECRET') as string,
        });
    }

    async validate(payload: { sub: number; role: Role; authVersion?: number }) {
        const current = await this.usersService.findAuthStateById(payload.sub);
        if (
            !current ||
            current.authVersion !== (payload.authVersion ?? 0) ||
            current.role !== payload.role
        ) {
            throw new UnauthorizedException('Session is no longer valid');
        }
        // Expose both `userId` (legacy convention used across controllers) and
        // `id` so guards/services that read `actor.id` (e.g. timetable
        // self-management) resolve the current user correctly.
        return { userId: payload.sub, id: payload.sub, role: payload.role };
    }
}
