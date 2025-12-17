import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config as loadEnv } from 'dotenv';
import path from 'path';
import fs from 'fs';
import { pathToFileURL } from 'url';

loadEnv();

async function run() {
    const url = process.env.DATABASE_URL;

    const dbConfig = url
        ? { url }
        : {
              host: process.env.DB_HOST || process.env.PGHOST,
              port: parseInt(
                  process.env.DB_PORT || process.env.PGPORT || '5432',
                  10,
              ),
              username: process.env.DB_USER || process.env.PGUSER,
              password: process.env.DB_PASS || process.env.PGPASSWORD,
              database: process.env.DB_NAME || process.env.PGDATABASE,
          };

    if (!url && (!dbConfig.host || !dbConfig.username || !dbConfig.database)) {
        console.error(
            'Missing database configuration. Set DATABASE_URL or DB_HOST/DB_USER/DB_NAME/DB_PASS.',
        );
        process.exit(1);
    }
    // Resolve compiled migration classes explicitly to avoid glob issues
    const migrationsDir = path.join(__dirname, 'migrations');
    type MigrationClass = new (...args: unknown[]) => {
        up: (...args: unknown[]) => unknown;
        down: (...args: unknown[]) => unknown;
    };
    const migrationClasses: MigrationClass[] = [];
    if (fs.existsSync(migrationsDir)) {
        for (const entry of fs.readdirSync(migrationsDir)) {
            if (!entry.endsWith('.js')) continue;
            try {
                const filePath = path.join(migrationsDir, entry);
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                const imported = await import(pathToFileURL(filePath).href);
                const entries = Object.entries(
                    imported as Record<string, unknown>,
                );
                function isMigrationClass(x: unknown): x is MigrationClass {
                    if (typeof x !== 'function') return false;
                    const candidate = (x as { prototype?: unknown }).prototype;
                    if (!candidate || typeof candidate !== 'object') {
                        return false;
                    }
                    const proto = candidate as Record<string, unknown>;
                    return (
                        typeof proto.up === 'function' &&
                        typeof proto.down === 'function'
                    );
                }
                for (const [, v] of entries) {
                    if (isMigrationClass(v)) {
                        migrationClasses.push(v);
                    }
                }
            } catch (e) {
                console.warn(
                    'Failed to load migration file',
                    entry,
                    (e as Error)?.message,
                );
            }
        }
    }

    const dataSource = new DataSource({
        type: 'postgres',
        ...dbConfig,
        migrations: migrationClasses,
        // entities are not required to run migrations
        // Prefer verified TLS when PGSSL=1; do not disable verification
        ssl: process.env.PGSSL === '1' ? true : undefined,
    });

    try {
        await dataSource.initialize();
        const results = await dataSource.runMigrations();

        console.log(`Applied ${results.length} migration(s).`);
    } catch (err) {
        console.error('Migration run failed', err);
        process.exit(1);
    } finally {
        await dataSource.destroy().catch(() => {});
    }
}

void run();
