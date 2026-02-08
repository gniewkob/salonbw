import { Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../users/role.enum';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import TestDataSeed from './seeds/test-data.seed';

@ApiTags('Database')
@Controller('database')
export class DatabaseController {
    constructor(
        @InjectDataSource() private dataSource: DataSource,
    ) {}

    @Post('seed-test-data')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Seed test data (employees, services, appointments)' })
    async seedTestData() {
        const seed = new TestDataSeed();
        await seed.run(this.dataSource);
        return { message: 'Test data seeded successfully' };
    }
}
