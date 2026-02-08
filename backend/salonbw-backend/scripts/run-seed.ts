import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config as loadEnv } from 'dotenv';
import TestDataSeed from '../src/database/seeds/test-data.seed';

// Import entities directly
import { User } from '../src/users/user.entity';
import { Service } from '../src/services/service.entity';
import { ServiceCategory } from '../src/services/entities/service-category.entity';
import { EmployeeService } from '../src/services/entities/employee-service.entity';
import { Appointment } from '../src/appointments/appointment.entity';

loadEnv();

async function runSeed() {
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

    const dataSource = new DataSource({
        type: 'postgres',
        ...dbConfig,
        entities: [User, Service, ServiceCategory, EmployeeService, Appointment],
        ssl: process.env.PGSSL === '1' ? true : undefined,
    });

    try {
        console.log('Connecting to database...');
        await dataSource.initialize();
        console.log('✓ Database connected');

        const seed = new TestDataSeed();
        await seed.run(dataSource);

        console.log('\n✓ Seed completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('✗ Seed failed:', error);
        process.exit(1);
    } finally {
        if (dataSource.isInitialized) {
            await dataSource.destroy().catch(() => {});
        }
    }
}

runSeed();
