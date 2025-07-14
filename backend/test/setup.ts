import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { beforeAll, afterAll, afterEach } from '@jest/globals';

config({ path: '.env' });
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'sqlite:./test.sqlite';
}

let dataSource: DataSource;

beforeAll(async () => {
  const url = process.env.DATABASE_URL as string;
  const isSqlite = url.startsWith('sqlite:');
  dataSource = new DataSource(
    isSqlite
      ? { type: 'sqlite', database: url.replace('sqlite:', '') }
      : { type: 'postgres', url }
  );
  await dataSource.initialize();
  (dataSource as any).isSqlite = isSqlite;
});

afterEach(async () => {
  if (dataSource?.isInitialized) {
    try {
      if ((dataSource as any).isSqlite) {
        await dataSource.query('DELETE FROM user');
        await dataSource
          .query("DELETE FROM sqlite_sequence WHERE name='user'")
          .catch(() => {});
      } else {
        await dataSource.query('TRUNCATE TABLE "user" RESTART IDENTITY CASCADE');
      }
    } catch {
      // ignore if table does not exist
    }
  }
});

afterAll(async () => {
  if (dataSource?.isInitialized) {
    await dataSource.destroy();
  }
});
