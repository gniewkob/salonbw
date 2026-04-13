import { config as loadEnv } from 'dotenv';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Client } = require('pg');

loadEnv();

type CliArgs = {
    sourceKey: string;
};

function usage(): never {
    console.error(
        'Usage: ts-node scripts/verify-versum-reference-db.ts [--source-key versum_downloads_2026_04_03]',
    );
    process.exit(1);
}

function parseArgs(argv: string[]): CliArgs {
    let sourceKey = 'versum_downloads_2026_04_03';

    for (let i = 0; i < argv.length; i += 1) {
        const arg = argv[i];
        if (!arg) continue;
        if (arg === '--source-key') {
            sourceKey = argv[i + 1] ?? sourceKey;
            i += 1;
            continue;
        }
        usage();
    }

    return { sourceKey };
}

function countMetric(value: unknown): number {
    if (!value) return 0;
    if (Array.isArray(value)) return value.length;
    if (typeof value === 'object' && value !== null) {
        const withItems = value as { items?: unknown[] };
        if (Array.isArray(withItems.items)) return withItems.items.length;
    }
    return 0;
}

async function main() {
    const { sourceKey } = parseArgs(process.argv.slice(2));
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        throw new Error('Missing DATABASE_URL in environment');
    }

    const client = new Client({ connectionString });
    await client.connect();
    try {
        const result = await client.query(
            `
            SELECT source_key, snapshot_generated_at, payload
            FROM versum_reference_snapshots
            WHERE source_key = $1
            LIMIT 1;
            `,
            [sourceKey],
        );

        const row = result.rows[0];
        if (!row) {
            throw new Error(
                `No reference snapshot found for source_key=${sourceKey}`,
            );
        }

        const metrics = row.payload?.metrics ?? {};
        const counts = {
            commissions: countMetric(metrics.commissions),
            tips: countMetric(metrics.tips),
            servicePopularityByEmployee: countMetric(
                metrics.servicePopularityByEmployee,
            ),
            returningCustomers: countMetric(metrics.returningCustomers),
            servicePopularity: countMetric(metrics.servicePopularity),
            customerOrigins: countMetric(metrics.customerOrigins),
        };

        const required = Object.entries(counts).every(([, count]) => count > 0);
        if (!required) {
            throw new Error(
                `Snapshot ${sourceKey} is incomplete: ${JSON.stringify(counts)}`,
            );
        }

        console.log(
            JSON.stringify(
                {
                    sourceKey: row.source_key,
                    snapshotGeneratedAt: row.snapshot_generated_at,
                    counts,
                    status: 'ok',
                },
                null,
                2,
            ),
        );
    } finally {
        await client.end();
    }
}

main().catch((error) => {
    console.error('Versum reference DB verification failed:', error);
    process.exit(1);
});
