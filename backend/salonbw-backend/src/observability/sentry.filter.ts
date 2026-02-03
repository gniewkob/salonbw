import { ArgumentsHost, Catch } from '@nestjs/common';
import { BaseExceptionFilter, HttpAdapterHost } from '@nestjs/core';
import * as Sentry from '@sentry/node';

@Catch()
export class SentryGlobalFilter extends BaseExceptionFilter {
    constructor(httpAdapterHost: HttpAdapterHost) {
        super(httpAdapterHost.httpAdapter);
    }

    catch(exception: unknown, host: ArgumentsHost) {
        if (Sentry.getClient()) {
            Sentry.captureException(exception);
        }
        super.catch(exception, host);
    }
}
