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
import { ConfigService } from '@nestjs/config';
import * as Sentry from '@sentry/node';

@Injectable()
export class HttpMetricsInterceptor implements NestInterceptor {
    private readonly slowThresholdSeconds: number;
    private readonly apmEnabled: boolean;

    constructor(
        private readonly metricsService: MetricsService,
        configService: ConfigService,
    ) {
        const slowThresholdMs = Number(
            configService.get<string>('APM_SLOW_REQUEST_MS', '1000'),
        );
        this.slowThresholdSeconds =
            Number.isFinite(slowThresholdMs) && slowThresholdMs > 0
                ? slowThresholdMs / 1000
                : Number.POSITIVE_INFINITY;
        this.apmEnabled = Boolean(configService.get<string>('SENTRY_DSN'));
    }

    intercept(
        context: ExecutionContext,
        next: CallHandler,
    ): Observable<unknown> {
        if (context.getType() !== 'http') {
            return next.handle();
        }

        const httpContext = context.switchToHttp();
        const request = httpContext.getRequest<
            Request & { route?: { path?: string } }
        >();
        const response = httpContext.getResponse<Response>();

        const method = request.method?.toUpperCase() ?? 'UNKNOWN';
        const endTimer = processRequestDuration();

        return next.handle().pipe(
            tap({
                next: () => {
                    const anyReq = request as unknown as Record<
                        string,
                        unknown
                    >;
                    const routePath =
                        typeof (anyReq.route as { path?: unknown } | undefined)
                            ?.path === 'string'
                            ? ((anyReq.route as { path?: string })
                                  ?.path as string)
                            : undefined;
                    const route =
                        routePath ??
                        request.baseUrl ??
                        request.originalUrl ??
                        request.url ??
                        'unmatched';
                    const duration = endTimer();
                    const status = response.statusCode ?? 200;
                    this.metricsService.recordHttpRequest(
                        method,
                        route,
                        status,
                        duration,
                    );
                    this.captureSlowTransaction(
                        route,
                        method,
                        status,
                        duration,
                    );
                },
                error: (err: unknown) => {
                    const anyReq = request as unknown as Record<
                        string,
                        unknown
                    >;
                    const routePath =
                        typeof (anyReq.route as { path?: unknown } | undefined)
                            ?.path === 'string'
                            ? ((anyReq.route as { path?: string })
                                  ?.path as string)
                            : undefined;
                    const route =
                        routePath ??
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
                    const duration = endTimer();
                    this.metricsService.recordHttpRequest(
                        method,
                        route,
                        status,
                        duration,
                    );
                    this.captureSlowTransaction(
                        route,
                        method,
                        status,
                        duration,
                    );
                },
            }),
        );
    }

    private captureSlowTransaction(
        route: string,
        method: string,
        status: number,
        durationSeconds: number,
    ) {
        if (!this.apmEnabled) {
            return;
        }
        if (
            !Number.isFinite(durationSeconds) ||
            durationSeconds < this.slowThresholdSeconds
        ) {
            return;
        }
        Sentry.withScope((scope) => {
            scope.setTag('http.method', method);
            scope.setTag('http.route', route);
            scope.setTag('http.status_code', String(status));
            scope.setExtra('duration_seconds', durationSeconds);
            scope.setLevel('warning');
            Sentry.captureMessage('slow_http_request');
        });
    }
}
