import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class HealthService {
    constructor(private readonly dataSource: DataSource) {}

    async assertDatabaseHealthy(): Promise<void> {
        try {
            await this.dataSource.query('SELECT 1');
        } catch {
            throw new ServiceUnavailableException('Database connection failed');
        }
    }
}
