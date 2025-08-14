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

        await this.logService.logAction(null, action, {
            endpoint: req.url,
            userId: req.user?.id,
        });

        res.status(exception.getStatus()).json(exception.getResponse());
    }
}
