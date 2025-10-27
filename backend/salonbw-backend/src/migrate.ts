import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config as loadEnv } from 'dotenv';
import path from 'path';
import fs from 'fs';
import { pathToFileURL } from 'url';

loadEnv();

async function run() {
    const url = process.env.DATABASE_URL;
    if (!url) {
        console.error('DATABASE_URL is not set');
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
                const mod: Record<string, unknown> = await import(
                    pathToFileURL(filePath).href
                );
                for (const key of Object.keys(mod)) {
                    const v = mod[key];
                    if (
                        typeof v === 'function' &&
                        (v as any)?.prototype &&
                        typeof (v as any).prototype.up === 'function' &&
                        typeof (v as any).prototype.down === 'function'
                    ) {
                        migrationClasses.push(v as MigrationClass);
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
        url,
        migrations: migrationClasses,
        // entities are not required to run migrations
        ssl:
            process.env.PGSSL === '1'
                ? { rejectUnauthorized: false }
                : undefined,
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
