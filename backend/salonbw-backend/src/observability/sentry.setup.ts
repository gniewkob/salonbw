import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Sentry from '@sentry/node';
// import { nodeProfilingIntegration } from '@sentry/profiling-node';
import type {
    Express,
    NextFunction,
    Request,
    RequestHandler,
    Response,
} from 'express';

let initialized = false;

function parseSampleRate(
    raw: string | number | undefined,
    fallback: number,
): number {
    const parsed =
        typeof raw === 'number'
            ? raw
            : typeof raw === 'string'
              ? Number(raw)
              : Number.NaN;
    if (!Number.isFinite(parsed) || parsed < 0) {
        return fallback;
    }
    return Math.min(1, Math.max(0, parsed));
}

export async function setupSentry(app: INestApplication): Promise<boolean> {
    const config = app.get(ConfigService);
    const dsn = config.get<string>('SENTRY_DSN');
    if (!dsn) {
        return false;
    }

    if (!initialized) {
        let nodeProfilingIntegration: any;
        try {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            const profiling = await import('@sentry/profiling-node');
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            nodeProfilingIntegration = profiling.nodeProfilingIntegration;
        } catch {
            // profiling module not found, skip
        }

        initialized = true;
        Sentry.init({
            dsn,
            environment: config.get<string>('NODE_ENV', 'development'),
            release: config.get<string>('SENTRY_RELEASE'),
            tracesSampleRate: parseSampleRate(
                config.get<string>('SENTRY_TRACES_SAMPLE_RATE', '0.1'),
                0.1,
            ),
            profilesSampleRate: parseSampleRate(
                config.get<string>('SENTRY_PROFILES_SAMPLE_RATE', '0'),
                0,
            ),
            integrations: (existing) => {
                const integrations = [...existing];
                if (nodeProfilingIntegration) {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
                    integrations.push(nodeProfilingIntegration());
                }
                return integrations;
            },
        });
    }

    const adapter = app.getHttpAdapter();
    const httpServer = adapter.getInstance() as Express;
    const sentryHandlers = (
        Sentry as typeof Sentry & {
            Handlers: {
                requestHandler: () => unknown;
                tracingHandler: () => unknown;
            };
        }
    ).Handlers;
    const requestHandler = sentryHandlers.requestHandler() as RequestHandler;
    const tracingHandler = sentryHandlers.tracingHandler() as RequestHandler;
    httpServer.use(requestHandler);
    httpServer.use(tracingHandler);
    httpServer.use(
        (
            req: Request & { id?: string },
            _res: Response,
            next: NextFunction,
        ) => {
            if (req.id && typeof req.id === 'string') {
                Sentry.setTag('request_id', req.id);
            }
            next();
        },
    );
    return true;
}
