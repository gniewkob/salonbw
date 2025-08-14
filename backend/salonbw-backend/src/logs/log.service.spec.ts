import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LogService } from './log.service';
import { Log } from './log.entity';
import { LogAction } from './log-action.enum';

describe('LogService', () => {
    let service: LogService;
    let repo: jest.Mocked<Repository<Log>>;

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            providers: [
                LogService,
                {
                    provide: getRepositoryToken(Log),
                    useValue: {
                        create: jest.fn<Log, [Log]>((entity) => entity),
                        save: jest.fn<Promise<Log>, [Log]>((log) =>
                            Promise.resolve(log),
                        ),
                    },
                },
            ],
        }).compile();

        service = module.get(LogService);
        repo = module.get<Repository<Log>>(
            getRepositoryToken(Log),
        ) as jest.Mocked<Repository<Log>>;
    });

    it('rejects description with password key', async () => {
        await expect(
            service.logAction(null, LogAction.USER_LOGIN, {
                password: 'secret',
            }),
        ).rejects.toThrow('Description contains sensitive information');
        expect(repo.save.mock.calls.length).toBe(0);
    });

    it('rejects description with token key', async () => {
        await expect(
            service.logAction(null, LogAction.USER_LOGIN, { token: 'abc' }),
        ).rejects.toThrow('Description contains sensitive information');
        expect(repo.save.mock.calls.length).toBe(0);
    });
});
