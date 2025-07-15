import { DataSource } from 'typeorm';
import { join } from 'path';
import { config } from 'dotenv';

config({ path: '.env' });
const url = process.env.DATABASE_URL || 'sqlite:./dev.sqlite';
const isSqlite = url.startsWith('sqlite:');
const dir = __dirname;

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
