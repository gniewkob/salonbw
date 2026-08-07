import { Controller, ForbiddenException, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../users/role.enum';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import TestDataSeed from './seeds/test-data.seed';

/**
 * Admin-only was NOT enough: the seed only inserts (employees, services,
 * clients, appointments), so on production it would quietly mix fabricated
 * rows in among real client records — a one-way mess once real data is
 * imported. Mirrors the guard the synthetic-data script already uses.
 *
 * Exported and pure so the rule is testable without booting Nest.
 */
export function assertSeedingAllowed(env: NodeJS.ProcessEnv): void {
    if (env.APP_LIFECYCLE === 'prelive') return;
    if (env.NODE_ENV !== 'production') return;
    throw new ForbiddenException(
        'Seeding test data is blocked on production. Set APP_LIFECYCLE=prelive to allow it.',
    );
}

@ApiTags('Database')
@Controller('database')
export class DatabaseController {
    constructor(@InjectDataSource() private dataSource: DataSource) {}

    @Post('seed-test-data')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin)
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Seed test data (employees, services, appointments)',
    })
    async seedTestData() {
        assertSeedingAllowed(process.env);
        const seed = new TestDataSeed();
        await seed.run(this.dataSource);
        return { message: 'Test data seeded successfully' };
    }
}
