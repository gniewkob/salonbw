import {
    Injectable,
    NestMiddleware,
    UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction) {
        // Ignore GET/HEAD/OPTIONS
        if (!req.method || /^(GET|HEAD|OPTIONS)$/i.test(req.method)) {
            return next();
        }

        const token = req.get('X-XSRF-TOKEN');
        const cookieToken = req.cookies?.['XSRF-TOKEN'];

        // Both token in header and cookie must be present and match
        if (!token || !cookieToken || token !== cookieToken) {
            throw new UnauthorizedException('CSRF token validation failed');
        }

        next();
    }
}
