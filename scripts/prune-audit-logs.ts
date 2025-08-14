import { Client } from "pg";

/**
 * Example script to delete audit logs older than N days.
 *
 * Usage:
 *   MAX_LOG_AGE_DAYS=90 DATABASE_URL=postgres://user:pass@host/db \
 *     npx ts-node -p pg scripts/prune-audit-logs.ts
 */
const DATABASE_URL = process.env.DATABASE_URL;
const MAX_LOG_AGE_DAYS = parseInt(process.env.MAX_LOG_AGE_DAYS ?? "30", 10);

if (!DATABASE_URL) {
    console.error("DATABASE_URL is required");
    process.exit(1);
}

async function pruneLogs() {
    const client = new Client({ connectionString: DATABASE_URL });
    await client.connect();

    const res = await client.query(
        "DELETE FROM logs WHERE \"timestamp\" < NOW() - $1 * INTERVAL '1 day'",
        [MAX_LOG_AGE_DAYS],
    );

    console.log(
        `Deleted ${res.rowCount} log entries older than ${MAX_LOG_AGE_DAYS} days`,
    );
    await client.end();
}

pruneLogs().catch((err) => {
    console.error("Failed to prune logs:", err);
    process.exit(1);
});
