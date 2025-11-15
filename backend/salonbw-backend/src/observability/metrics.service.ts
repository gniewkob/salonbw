import { Injectable } from '@nestjs/common';
import {
    collectDefaultMetrics,
    Counter,
    Gauge,
    Histogram,
    Registry,
} from 'prom-client';

type RouteLabel = string;

@Injectable()
export class MetricsService {
    private readonly registry: Registry;
    private readonly httpRequestDurationSeconds: Histogram<string>;
    private readonly httpRequestTotal: Counter<string>;
    private readonly emailsSentTotal: Counter<string>;
    private readonly appointmentsCreatedTotal: Counter<string>;
    private readonly appointmentsCompletedTotal: Counter<string>;

    // Database metrics
    private readonly dbConnectionsActive: Gauge<string>;
    private readonly dbConnectionsIdle: Gauge<string>;
    private readonly dbConnectionsTotal: Gauge<string>;
    private readonly dbQueryDurationSeconds: Histogram<string>;
    private readonly dbQueriesTotal: Counter<string>;

    constructor() {
        this.registry = new Registry();
        collectDefaultMetrics({
            register: this.registry,
            prefix: 'salonbw_',
        });

        this.httpRequestDurationSeconds = new Histogram({
            name: 'salonbw_http_server_request_duration_seconds',
            help: 'Time spent serving HTTP requests',
            labelNames: ['method', 'route', 'status_code'],
            buckets: [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
            registers: [this.registry],
        });

        this.httpRequestTotal = new Counter({
            name: 'salonbw_http_server_requests_total',
            help: 'Total number of HTTP requests served',
            labelNames: ['method', 'route', 'status_code'],
            registers: [this.registry],
        });

        this.emailsSentTotal = new Counter({
            name: 'salonbw_emails_sent_total',
            help: 'Number of emails processed by the system',
            labelNames: ['status'], // success | failed
            registers: [this.registry],
        });

        this.appointmentsCreatedTotal = new Counter({
            name: 'salonbw_appointments_created_total',
            help: 'Number of appointments created',
            registers: [this.registry],
        });

        this.appointmentsCompletedTotal = new Counter({
            name: 'salonbw_appointments_completed_total',
            help: 'Number of appointments completed',
            registers: [this.registry],
        });

        // Database connection pool metrics
        this.dbConnectionsActive = new Gauge({
            name: 'salonbw_db_connections_active',
            help: 'Number of active database connections',
            registers: [this.registry],
        });

        this.dbConnectionsIdle = new Gauge({
            name: 'salonbw_db_connections_idle',
            help: 'Number of idle database connections in the pool',
            registers: [this.registry],
        });

        this.dbConnectionsTotal = new Gauge({
            name: 'salonbw_db_connections_total',
            help: 'Total number of database connections in the pool',
            registers: [this.registry],
        });

        // Database query metrics
        this.dbQueryDurationSeconds = new Histogram({
            name: 'salonbw_db_query_duration_seconds',
            help: 'Time spent executing database queries',
            labelNames: ['query_type'], // select, insert, update, delete
            buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2],
            registers: [this.registry],
        });

        this.dbQueriesTotal = new Counter({
            name: 'salonbw_db_queries_total',
            help: 'Total number of database queries executed',
            labelNames: ['query_type', 'status'], // status: success | error
            registers: [this.registry],
        });
    }

    recordHttpRequest(
        method: string,
        route: RouteLabel,
        statusCode: number,
        durationSeconds: number,
    ): void {
        const labels = {
            method,
            route,
            status_code: `${statusCode}`,
        };
        this.httpRequestDurationSeconds.observe(labels, durationSeconds);
        this.httpRequestTotal.inc(labels);
    }

    getMetrics(): Promise<string> {
        return this.registry.metrics();
    }

    get contentType(): string {
        return this.registry.contentType;
    }

    incEmail(status: 'success' | 'failed'): void {
        this.emailsSentTotal.inc({ status });
    }

    incAppointmentCreated(): void {
        this.appointmentsCreatedTotal.inc();
    }

    incAppointmentCompleted(): void {
        this.appointmentsCompletedTotal.inc();
    }

    // Database metrics methods
    setDbConnectionsActive(count: number): void {
        this.dbConnectionsActive.set(count);
    }

    setDbConnectionsIdle(count: number): void {
        this.dbConnectionsIdle.set(count);
    }

    setDbConnectionsTotal(count: number): void {
        this.dbConnectionsTotal.set(count);
    }

    recordDbQuery(
        queryType: 'select' | 'insert' | 'update' | 'delete' | 'other',
        durationSeconds: number,
        status: 'success' | 'error',
    ): void {
        this.dbQueryDurationSeconds.observe(
            { query_type: queryType },
            durationSeconds,
        );
        this.dbQueriesTotal.inc({ query_type: queryType, status });
    }
}
