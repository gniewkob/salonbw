import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config as loadEnv } from 'dotenv';
import path from 'path';
import fs from 'fs';

loadEnv();

async function run() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    // eslint-disable-next-line no-console
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }
  // Resolve compiled migration classes explicitly to avoid glob issues
  const migrationsDir = path.join(__dirname, 'migrations');
  const migrationClasses: (Function | string)[] = [];
  if (fs.existsSync(migrationsDir)) {
    for (const entry of fs.readdirSync(migrationsDir)) {
      if (!entry.endsWith('.js')) continue;
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const mod = require(path.join(migrationsDir, entry));
        for (const key of Object.keys(mod)) {
          const v = (mod as Record<string, unknown>)[key] as any;
          if (
            typeof v === 'function' &&
            v?.prototype &&
            typeof v.prototype.up === 'function' &&
            typeof v.prototype.down === 'function'
          ) {
            migrationClasses.push(v as unknown as Function);
          }
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('Failed to load migration file', entry, (e as Error)?.message);
      }
    }
  }

  const dataSource = new DataSource({
    type: 'postgres',
    url,
    migrations: migrationClasses,
    // entities are not required to run migrations
    ssl: process.env.PGSSL === '1' ? { rejectUnauthorized: false } : undefined,
  });

  try {
    await dataSource.initialize();
    const results = await dataSource.runMigrations();
    // eslint-disable-next-line no-console
    console.log(`Applied ${results.length} migration(s).`);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Migration run failed', err);
    process.exit(1);
  } finally {
    await dataSource.destroy().catch(() => {});
  }
}

void run();
