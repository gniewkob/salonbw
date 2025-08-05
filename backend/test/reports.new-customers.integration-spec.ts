import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { ReportsService } from '../src/reports/reports.service';
import { DataSource, Repository } from 'typeorm';
import { User } from '../src/users/user.entity';
import { Log } from '../src/logs/log.entity';
import { Role } from '../src/users/role.enum';
import { LogAction } from '../src/logs/action.enum';

describe('ReportsService.getNewCustomers (integration)', () => {
    let moduleRef: TestingModule;
    let reports: ReportsService;
    let dataSource: DataSource;
    let users: Repository<User>;
    let logs: Repository<Log>;

    beforeEach(async () => {
        moduleRef = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        reports = moduleRef.get(ReportsService);
        dataSource = moduleRef.get(DataSource);
        users = dataSource.getRepository(User);
        logs = dataSource.getRepository(Log);
    });

    afterEach(async () => {
        await moduleRef.close();
    });

    it('counts new customers within date range without duplicates', async () => {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(end.getDate() + 1);

        await users.save({
            email: 'u1@rep.com',
            password: 'secret',
            firstName: 'U1',
            lastName: 'One',
            role: Role.Client,
        });

        const oldDate = new Date(start);
        oldDate.setDate(oldDate.getDate() - 2);
        const user2 = await users.save({
            email: 'u2@rep.com',
            password: 'secret',
            firstName: 'U2',
            lastName: 'Two',
            role: Role.Client,
            createdAt: oldDate,
        });
        await users.update({ id: user2.id }, { createdAt: oldDate });
        await logs.save({
            action: LogAction.RegisterSuccess,
            description: '',
            user: { id: user2.id } as any,
            actor: null,
            timestamp: new Date(start.getTime() + 1_000),
        });

        const user3 = await users.save({
            email: 'u3@rep.com',
            password: 'secret',
            firstName: 'U3',
            lastName: 'Three',
            role: Role.Client,
        });
        await logs.save({
            action: LogAction.RegisterSuccess,
            description: '',
            user: { id: user3.id } as any,
            actor: null,
            timestamp: new Date(start.getTime() + 2_000),
        });

        const employee = await users.save({
            email: 'emp@rep.com',
            password: 'secret',
            firstName: 'Emp',
            lastName: 'Loyee',
            role: Role.Employee,
        });
        await logs.save({
            action: LogAction.RegisterSuccess,
            description: '',
            user: { id: employee.id } as any,
            actor: null,
            timestamp: new Date(start.getTime() + 3_000),
        });

        const result = await reports.getNewCustomers(
            start.toISOString(),
            end.toISOString(),
        );
        expect(result.count).toBe(3);
    });
});

