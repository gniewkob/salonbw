import fs from 'fs';
import { config as loadEnv } from 'dotenv';
// Avoid type-declaration dependency for script-only usage.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Client } = require('pg');

loadEnv();

type CliArgs = {
    snapshotPath: string;
    sourceKey: string;
};

function usage(): never {
    console.error(
        'Usage: ts-node scripts/save-versum-reference-snapshot-db.ts --snapshot /tmp/versum-reference-snapshot.json [--source-key versum_exports_2026_04_03]',
    );
    process.exit(1);
}

function parseArgs(argv: string[]): CliArgs {
    let snapshotPath: string | undefined;
    let sourceKey = `versum_exports_${new Date().toISOString().slice(0, 10).replace(/-/g, '_')}`;

    for (let i = 0; i < argv.length; i += 1) {
        const arg = argv[i];
        if (!arg) continue;
        if (arg === '--snapshot') {
            snapshotPath = argv[i + 1];
            i += 1;
            continue;
        }
        if (arg === '--source-key') {
            sourceKey = argv[i + 1] ?? sourceKey;
            i += 1;
            continue;
        }
        usage();
    }

    if (!snapshotPath) usage();
    return { snapshotPath, sourceKey };
}

async function ensureTable(client: any): Promise<void> {
    await client.query(`
        CREATE TABLE IF NOT EXISTS versum_reference_snapshots (
            id SERIAL PRIMARY KEY,
            source_key TEXT NOT NULL UNIQUE,
            snapshot_generated_at TIMESTAMPTZ NULL,
            payload JSONB NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    `);
}

function parseGeneratedAt(value: unknown): string | null {
    if (!value || typeof value !== 'string') return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

async function main() {
    const { snapshotPath, sourceKey } = parseArgs(process.argv.slice(2));
    if (!fs.existsSync(snapshotPath)) {
        throw new Error(`Snapshot file not found: ${snapshotPath}`);
    }

    const payloadRaw = fs.readFileSync(snapshotPath, 'utf8');
    const payload = JSON.parse(payloadRaw) as Record<string, unknown>;
    const snapshotGeneratedAt = parseGeneratedAt(payload.generatedAt);

    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        throw new Error('Missing DATABASE_URL in environment');
    }

    const client = new Client({ connectionString });
    await client.connect();
    try {
        await ensureTable(client);
        const result = await client.query(
            `
            INSERT INTO versum_reference_snapshots (
                source_key,
                snapshot_generated_at,
                payload
            ) VALUES ($1, $2, $3::jsonb)
            ON CONFLICT (source_key)
            DO UPDATE SET
                snapshot_generated_at = EXCLUDED.snapshot_generated_at,
                payload = EXCLUDED.payload,
                updated_at = NOW()
            RETURNING id, source_key, snapshot_generated_at, created_at, updated_at;
            `,
            [sourceKey, snapshotGeneratedAt, JSON.stringify(payload)],
        );

        console.log(
            JSON.stringify(
                {
                    snapshotPath,
                    sourceKey,
                    row: result.rows[0],
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
    console.error('Failed to save Versum reference snapshot:', error);
    process.exit(1);
});
