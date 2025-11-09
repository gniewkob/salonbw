# Database Optimization Guide

This document outlines the database performance optimizations implemented in the SalonBW backend.

## Connection Pooling

The application uses PostgreSQL connection pooling to efficiently manage database connections and improve performance.

### Configuration

Connection pool settings can be configured via environment variables in `.env`:

```bash
# Maximum number of connections in pool (default: 10)
DB_POOL_SIZE=10

# Minimum number of connections to maintain (default: 2)
DB_POOL_MIN=2

# Close idle connections after this time in milliseconds (default: 30000)
DB_IDLE_TIMEOUT_MS=30000

# Fail connection attempts after this time in milliseconds (default: 5000)
DB_CONNECTION_TIMEOUT_MS=5000
```

### Recommended Settings

- **Small applications (< 100 concurrent users)**: `DB_POOL_SIZE=10`, `DB_POOL_MIN=2`
- **Medium applications (100-1000 users)**: `DB_POOL_SIZE=20`, `DB_POOL_MIN=5`
- **Large applications (> 1000 users)**: `DB_POOL_SIZE=50`, `DB_POOL_MIN=10`

**Note**: PostgreSQL default `max_connections` is 100. Ensure your pool size doesn't exceed available database connections.

## Query Performance

### Slow Query Logging

In development mode, queries taking longer than 1 second are automatically logged to help identify performance bottlenecks.

Configuration in [app.module.ts](../backend/salonbw-backend/src/app.module.ts):
```typescript
maxQueryExecutionTime: nodeEnv === 'development' ? 1000 : undefined
```

### Statement Timeouts

Database connections have a 30-second statement timeout to prevent long-running queries from blocking resources:

```typescript
extra: {
    statement_timeout: 30000, // Cancel queries after 30s
    query_timeout: 30000,
}
```

## Query Result Caching

TypeORM query result caching is enabled to reduce database load for frequently accessed data.

### Configuration

Cache configuration in [app.module.ts](../backend/salonbw-backend/src/app.module.ts):
```typescript
cache: {
    duration: 30000, // Cache results for 30s
    type: 'database', // Use database for query result caching
}
```

### Usage Examples

#### Enable caching for a specific query:

```typescript
// Cache results for 30 seconds (default)
const products = await this.productRepository.find({
    cache: true,
});

// Cache with custom duration (60 seconds)
const services = await this.serviceRepository.find({
    cache: 60000,
});

// Cache with custom identifier for manual invalidation
const activeAppointments = await this.appointmentRepository.find({
    where: { status: AppointmentStatus.Confirmed },
    cache: {
        id: 'active_appointments',
        milliseconds: 60000,
    },
});
```

#### Clear cache manually:

```typescript
// Clear all cached queries
await this.connection.queryResultCache.clear();

// Clear specific cached query by identifier
await this.connection.queryResultCache.remove(['active_appointments']);
```

#### Best practices:

1. **Use caching for read-heavy operations**: Product lists, service catalogs, user profiles
2. **Avoid caching frequently changing data**: Real-time appointment statuses, inventory levels
3. **Set appropriate cache durations**: Balance between freshness and performance
4. **Use cache identifiers**: For manual invalidation when data changes

Example in a service:
```typescript
@Injectable()
export class ProductsService {
    async findAll(): Promise<Product[]> {
        // Cache product list for 5 minutes
        return this.productRepository.find({
            cache: {
                id: 'products_list',
                milliseconds: 300000,
            },
        });
    }

    async updateProduct(id: number, data: UpdateProductDto): Promise<Product> {
        const product = await this.productRepository.save({ id, ...data });

        // Invalidate cache after update
        await this.connection.queryResultCache.remove(['products_list']);

        return product;
    }
}
```

## Database Metrics

Database performance metrics are exposed via the `/metrics` endpoint for Prometheus monitoring.

### Available Metrics

**Connection Pool Metrics:**
- `salonbw_db_connections_active` - Number of active database connections
- `salonbw_db_connections_idle` - Number of idle connections in the pool
- `salonbw_db_connections_total` - Total connections in the pool

**Query Metrics:**
- `salonbw_db_query_duration_seconds` - Histogram of query execution times
- `salonbw_db_queries_total` - Total number of queries executed (by type and status)

### Monitoring

Use these metrics to:
1. Detect connection pool exhaustion (active ≈ total)
2. Identify slow queries (high percentiles in duration histogram)
3. Track query error rates
4. Optimize pool size based on actual usage

Example Prometheus queries:
```promql
# Average active connections
avg_over_time(salonbw_db_connections_active[5m])

# 95th percentile query duration
histogram_quantile(0.95, rate(salonbw_db_query_duration_seconds_bucket[5m]))

# Query error rate
rate(salonbw_db_queries_total{status="error"}[5m])
```

## Migration

To apply the query result cache table migration:

```bash
cd backend/salonbw-backend
pnpm run build
pnpm run migrate
```

## Performance Testing

After implementing these optimizations, monitor:

1. **Connection pool utilization**: Should stay below 80% under normal load
2. **Query execution time**: Most queries < 100ms, none > 1s
3. **Cache hit rate**: Track in application logs when queries hit cache
4. **Database CPU/Memory**: Should decrease with effective caching

## Troubleshooting

### Connection Pool Exhausted

**Symptoms**: `TimeoutError: ResourceRequest timed out`

**Solutions**:
1. Increase `DB_POOL_SIZE`
2. Decrease `DB_CONNECTION_TIMEOUT_MS`
3. Check for connection leaks (missing `await` or error handling)

### Slow Queries

**Symptoms**: Queries logged as slow in development

**Solutions**:
1. Add database indexes on frequently queried columns
2. Optimize query joins and where clauses
3. Enable query result caching for read-heavy operations
4. Use database query analyzer: `EXPLAIN ANALYZE <query>`

### Cache Not Working

**Symptoms**: No performance improvement, all queries hitting database

**Solutions**:
1. Ensure migration created `query-result-cache` table
2. Verify cache configuration in TypeORM options
3. Check cache is explicitly enabled on queries
4. Review cache duration settings

## Future Enhancements

Potential optimizations for future implementation:

1. **Redis caching**: Replace database caching with Redis for better performance
2. **Read replicas**: Distribute read queries across replica databases
3. **Query optimization**: Add indexes based on slow query analysis
4. **Materialized views**: Pre-compute complex aggregations
5. **Database partitioning**: Partition large tables by date or other criteria
