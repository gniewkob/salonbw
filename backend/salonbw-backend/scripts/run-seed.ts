import { DataSource } from 'typeorm';
import { AppDataSource } from '../src/data-source';
import TestDataSeed from '../src/database/seeds/test-data.seed';

async function runSeed() {
    let dataSource: DataSource;
    
    try {
        console.log('Connecting to database...');
        dataSource = await AppDataSource.initialize();
        console.log('✓ Database connected');

        const seed = new TestDataSeed();
        await seed.run(dataSource);

        console.log('\n✓ Seed completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('✗ Seed failed:', error);
        process.exit(1);
    } finally {
        if (dataSource?.isInitialized) {
            await dataSource.destroy();
        }
    }
}

runSeed();
