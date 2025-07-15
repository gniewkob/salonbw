import { DataSource } from 'typeorm';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

config({ path: '.env' });
const url = process.env.DATABASE_URL || 'sqlite:./dev.sqlite';
const isSqlite = url.startsWith('sqlite:');
const dir = dirname(fileURLToPath(import.meta.url));

export const AppDataSource = new DataSource(
  isSqlite
    ? {
        type: 'sqlite',
        database: url.replace('sqlite:', ''),
        entities: [join(dir, '**/*.entity.ts')],
      }
    : {
        type: 'postgres',
        url,
        entities: [join(dir, '**/*.entity.ts')],
        migrations: [join(dir, 'migrations/*.ts')],
      },
);
