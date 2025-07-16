import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    ForbiddenException,
    UnauthorizedException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { LogsService } from './logs.service';
import { LogAction } from './action.enum';

@Catch(ForbiddenException, UnauthorizedException)
export class LoggingExceptionFilter
    implements ExceptionFilter<ForbiddenException | UnauthorizedException>
{
    constructor(private readonly logs: LogsService) {}

    catch(
        exception: ForbiddenException | UnauthorizedException,
        host: ArgumentsHost,
    ) {
        const ctx = host.switchToHttp();
        const request = ctx.getRequest<Request>();
        const response = ctx.getResponse<Response>();
        const description = `${request.method} ${request.url}`;
        const userId = (request as any).user?.id as number | undefined;
        if (exception instanceof ForbiddenException) {
            void this.logs.create(
                LogAction.ForbiddenAccess,
                description,
                userId,
            );
        } else if (exception instanceof UnauthorizedException) {
            void this.logs.create(LogAction.LoginFail, description, userId);
        }
        response.status(exception.getStatus()).json(exception.getResponse());
    }
}
