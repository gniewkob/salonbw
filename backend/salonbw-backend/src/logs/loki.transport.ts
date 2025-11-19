import type { TransportTargetOptions } from 'pino';

interface LokiTransportOptions extends TransportTargetOptions {
    lokiUrl: string;
    basicAuth?: string;
    service?: string;
    environment?: string;
}

type LokiEntry = {
    level?: string | number;
    time?: number;
    context?: string;
    [key: string]: unknown;
};

export default function lokiTransport(options: LokiTransportOptions) {
    const {
        lokiUrl,
        basicAuth,
        service = 'salonbw-backend',
        environment = process.env.NODE_ENV ?? 'development',
    } = options;
    const fetchImpl = resolveFetch();

    return async function transport(source: AsyncIterable<string>) {
        for await (const line of source) {
            try {
                const payload = buildPayload(line, service, environment);
                const response = await fetchImpl(lokiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(basicAuth
                            ? {
                                  Authorization: `Basic ${Buffer.from(
                                      basicAuth,
                                  ).toString('base64')}`,
                              }
                            : {}),
                    },
                    body: JSON.stringify(payload),
                });
                if (!response.ok) {
                    throw new Error(
                        `Loki responded with ${response.status} ${response.statusText}`,
                    );
                }
            } catch (error: unknown) {
                console.error('failed to ship log to Loki', error);
            }
        }
    };
}
function resolveFetch() {
    if (typeof fetch !== 'function') {
        throw new Error('fetch API is not available in this environment');
    }
    return fetch;
}

function buildPayload(line: string, service: string, environment: string) {
    const entry = parseEntry(line);
    const timestampNs = `${entry.time ?? Date.now()}000000`;

    return {
        streams: [
            {
                stream: {
                    service,
                    level: normalizeLevel(entry.level),
                    environment,
                    context: entry.context ?? 'app',
                },
                values: [[timestampNs, JSON.stringify(entry)]],
            },
        ],
    };
}

function parseEntry(line: string): LokiEntry {
    const parsed = JSON.parse(line) as unknown;
    if (!isRecord(parsed)) {
        return {};
    }
    const entry: LokiEntry = {
        level: parsed.level as LokiEntry['level'],
        time: typeof parsed.time === 'number' ? parsed.time : undefined,
        context:
            typeof parsed.context === 'string' ? parsed.context : undefined,
        ...parsed,
    };
    return entry;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

function normalizeLevel(level: string | number | undefined) {
    if (typeof level === 'number') {
        if (level >= 60) return 'fatal';
        if (level >= 50) return 'error';
        if (level >= 40) return 'warn';
        if (level >= 30) return 'info';
        if (level >= 20) return 'debug';
        return 'trace';
    }
    return level ?? 'info';
}
