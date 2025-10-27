import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    ForbiddenException,
    UnauthorizedException,
} from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { Request, Response } from 'express';
import { LogService } from './log.service';
import { LogAction } from './log-action.enum';
import { User } from '../users/user.entity';

@Catch(UnauthorizedException, ForbiddenException)
export class AuthFailureFilter implements ExceptionFilter {
    constructor(
        private readonly logService: LogService,
        private readonly logger: PinoLogger,
    ) {
        this.logger.setContext(AuthFailureFilter.name);
    }

    async catch(
        exception: UnauthorizedException | ForbiddenException,
        host: ArgumentsHost,
    ): Promise<void> {
        const ctx = host.switchToHttp();
        const req = ctx.getRequest<
            Request & { user?: { id?: number; userId?: number }; id?: string; log?: PinoLogger }
        >();
        const res = ctx.getResponse<Response>();
        const action =
            exception instanceof UnauthorizedException &&
            exception.message === 'Invalid credentials'
                ? LogAction.LOGIN_FAIL
                : LogAction.AUTHORIZATION_FAILURE;

        const userId = req.user?.id ?? req.user?.userId;
        const user = userId ? ({ id: userId } as User) : null;
        const requestLogger = req.log ?? this.logger;

        try {
            await this.logService.logAction(user, action, {
                endpoint: req.url,
                userId,
            });
            requestLogger.warn(
                {
                    requestId: req.id,
                    action,
                    userId: user?.id,
                },
                'authorisation failure recorded',
            );
        } catch (error: unknown) {
            requestLogger.error(
                {
                    err:
                        error instanceof Error
                            ? error
                            : { message: String(error) },
                    requestId: req.id,
                },
                'failed to persist authentication log entry',
            );
        }

        res.status(exception.getStatus()).json(exception.getResponse());
    }
}
