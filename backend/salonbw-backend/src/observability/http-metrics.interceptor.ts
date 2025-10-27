import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request, Response } from 'express';
import { MetricsService } from './metrics.service';
import { processRequestDuration } from './metrics.utils';

@Injectable()
export class HttpMetricsInterceptor implements NestInterceptor {
    constructor(private readonly metricsService: MetricsService) {}

    intercept(
        context: ExecutionContext,
        next: CallHandler,
    ): Observable<unknown> {
        if (context.getType() !== 'http') {
            return next.handle();
        }

        const httpContext = context.switchToHttp();
        const request = httpContext.getRequest<Request & { route?: { path?: string } }>();
        const response = httpContext.getResponse<Response>();

        const method = request.method?.toUpperCase() ?? 'UNKNOWN';
        const endTimer = processRequestDuration();

        return next.handle().pipe(
            tap({
                next: () => {
                    const route =
                        request.route?.path ??
                        request.baseUrl ??
                        request.originalUrl ??
                        request.url ??
                        'unmatched';
                    this.metricsService.recordHttpRequest(
                        method,
                        route,
                        response.statusCode ?? 200,
                        endTimer(),
                    );
                },
                error: (err: unknown) => {
                    const route =
                        request.route?.path ??
                        request.baseUrl ??
                        request.originalUrl ??
                        request.url ??
                        'unmatched';
                    const status = ((): number => {
                        if (typeof err === 'object' && err !== null) {
                            const anyErr = err as { status?: number };
                            if (typeof anyErr.status === 'number') {
                                return anyErr.status;
                            }
                        }
                        return 500;
                    })();
                    this.metricsService.recordHttpRequest(
                        method,
                        route,
                        status,
                        endTimer(),
                    );
                },
            }),
        );
    }
}
