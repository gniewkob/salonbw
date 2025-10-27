import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config as loadEnv } from 'dotenv';
import path from 'path';

loadEnv();

async function run() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    // eslint-disable-next-line no-console
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }
  const dataSource = new DataSource({
    type: 'postgres',
    url,
    migrations: [path.join(__dirname, 'migrations', '*.{js}')],
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

