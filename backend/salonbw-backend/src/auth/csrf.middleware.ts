import {
    Injectable,
    NestMiddleware,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash, timingSafeEqual } from 'crypto';
import type { Request, Response, NextFunction } from 'express';
import { RefreshToken } from './refresh-token.entity';

const EXCLUDED_PATHS = new Set([
    '/auth/login',
    '/auth/register',
    '/api/auth/login',
    '/api/auth/register',
    '/logs/client',
    // Public contact form endpoint (no session cookies / CSRF token)
    '/emails/send',
    // Calendar endpoints - authenticated via JWT, vendored JS doesn't send CSRF
    '/graphql',
    '/events',
    '/settings/timetable',
    '/track_new_events',
    '/fresh_chat_user',
    '/todo/alerts',
    // Database seed endpoint - admin only, useful for testing
    '/database/seed-test-data',
]);

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        @InjectRepository(RefreshToken)
        private readonly refreshRepo: Repository<RefreshToken>,
    ) {}

    async use(req: Request, res: Response, next: NextFunction) {
        // Ignore GET/HEAD/OPTIONS
        if (!req.method || /^(GET|HEAD|OPTIONS)$/i.test(req.method)) {
            return next();
        }

        const path = `${req.baseUrl ?? ''}${req.path ?? ''}` || req.originalUrl;
        const debug =
            this.configService.get<string>('CSRF_DEBUG', 'false') === 'true';

        if (debug && res?.setHeader) {
            res.setHeader('X-Debug-Path', path || 'empty');
            res.setHeader('X-Debug-Original', req.originalUrl || 'empty');
        }

        const isExcluded = Array.from(EXCLUDED_PATHS).some((excluded) =>
            path.includes(excluded),
        );

        if (path && isExcluded) {
            return next();
        }

        const token = req.get('X-XSRF-TOKEN');
        if (!token) {
            throw new UnauthorizedException('CSRF token missing');
        }

        const cookieToken = req.cookies?.['XSRF-TOKEN'] as string | undefined;
        if (!cookieToken || cookieToken !== token) {
            throw new UnauthorizedException('CSRF token validation failed');
        }

        const refreshCookie = req.cookies?.['refreshToken'] as
            | string
            | undefined;
        if (!refreshCookie) {
            throw new UnauthorizedException('Missing session context for CSRF');
        }

        const refreshSecret =
            this.configService.get<string>('JWT_REFRESH_SECRET');
        if (!refreshSecret) {
            throw new UnauthorizedException('CSRF validation unavailable');
        }

        type RefreshPayload = { jti?: string };
        let payload: RefreshPayload | null = null;
        try {
            payload = this.jwtService.verify<RefreshPayload>(refreshCookie, {
                secret: refreshSecret,
            });
        } catch {
            throw new UnauthorizedException(
                'Invalid session for CSRF validation',
            );
        }

        if (!payload?.jti) {
            throw new UnauthorizedException('CSRF token validation failed');
        }

        const refresh = await this.refreshRepo.findOne({
            where: { jti: payload.jti },
        });
        if (!refresh || refresh.revokedAt) {
            throw new UnauthorizedException('CSRF token validation failed');
        }

        let metaValue: Record<string, unknown> | null = null;
        if (refresh.meta && typeof refresh.meta === 'object') {
            metaValue = refresh.meta;
        } else if (typeof refresh.meta === 'string') {
            try {
                metaValue = JSON.parse(refresh.meta) as Record<string, unknown>;
            } catch {
                metaValue = null;
            }
        }
        const storedHash = (metaValue?.csrfSecretHash ?? null) as string | null;
        if (!storedHash) {
            throw new UnauthorizedException('CSRF token validation failed');
        }

        const providedHash = createHash('sha256').update(token).digest('hex');
        const expectedBuffer = Buffer.from(storedHash, 'hex');
        const providedBuffer = Buffer.from(providedHash, 'hex');
        if (
            expectedBuffer.length !== providedBuffer.length ||
            !timingSafeEqual(expectedBuffer, providedBuffer)
        ) {
            throw new UnauthorizedException('CSRF token validation failed');
        }

        return next();
    }
}
