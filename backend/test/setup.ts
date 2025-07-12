import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { beforeAll, afterAll, afterEach } from '@jest/globals';

config({ path: '.env' });

let dataSource: DataSource;

beforeAll(async () => {
  dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
  });
  await dataSource.initialize();
});

afterEach(async () => {
  if (dataSource?.isInitialized) {
    await dataSource.query('TRUNCATE TABLE "user" RESTART IDENTITY CASCADE');
  }
});

afterAll(async () => {
  if (dataSource?.isInitialized) {
    await dataSource.destroy();
  }
});
