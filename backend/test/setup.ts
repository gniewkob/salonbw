import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { beforeAll, afterAll, afterEach } from '@jest/globals';
import { join } from 'path';
import { Service as CatalogService } from '../src/catalog/service.entity';

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
      ? {
          type: 'sqlite',
          database: url.replace('sqlite:', ''),
          entities: [join(__dirname, '../src/**/*.entity.ts')],
        }
      : {
          type: 'postgres',
          url,
          migrations: [join(__dirname, '../src/migrations/*.ts')],
        }
  );
  await dataSource.initialize();
  if (isSqlite) {
    await dataSource.synchronize();
  } else {
    await dataSource.runMigrations();
  }
  const repo = dataSource.getRepository(CatalogService);
  await repo.save(repo.create({ name: 'cut', duration: 30, price: 10 }));
  (dataSource as any).isSqlite = isSqlite;
});

afterEach(async () => {
  if (dataSource?.isInitialized) {
    if ((dataSource as any).isSqlite) {
      await dataSource.synchronize(true);
    } else {
      await dataSource.dropDatabase();
      await dataSource.runMigrations();
    }
    const repo = dataSource.getRepository(CatalogService);
    await repo.save(repo.create({ name: 'cut', duration: 30, price: 10 }));
  }
});

afterAll(async () => {
  if (dataSource?.isInitialized) {
    await dataSource.destroy();
  }
});
