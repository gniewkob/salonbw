import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    ForbiddenException,
    UnauthorizedException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { LogService } from './log.service';
import { LogAction } from './log-action.enum';
import { User } from '../users/user.entity';

@Catch(UnauthorizedException, ForbiddenException)
export class AuthFailureFilter implements ExceptionFilter {
    constructor(private readonly logService: LogService) {}

    async catch(
        exception: UnauthorizedException | ForbiddenException,
        host: ArgumentsHost,
    ): Promise<void> {
        const ctx = host.switchToHttp();
        interface RequestWithUser extends Request {
            user?: { id?: number };
        }
        const req = ctx.getRequest<RequestWithUser>();
        const res = ctx.getResponse<Response>();
        const action =
            exception instanceof UnauthorizedException &&
            exception.message === 'Invalid credentials'
                ? LogAction.LOGIN_FAIL
                : LogAction.AUTHORIZATION_FAILURE;

        const userId = (req.user as { id?: number; userId?: number } | undefined)
            ?.id ?? (req.user as { userId?: number } | undefined)?.userId;
        const user = userId ? ({ id: userId } as User) : null;

        try {
            await this.logService.logAction(user, action, {
                endpoint: req.url,
                userId,
            });
        } catch (error) {
            console.error('Failed to log authentication failure action', error);
        }

        res.status(exception.getStatus()).json(exception.getResponse());
    }
}
