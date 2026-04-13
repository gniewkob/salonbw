import { Test, TestingModule } from '@nestjs/testing';
import { EmailsService } from './emails.service';
import { ConfigService } from '@nestjs/config';
import { MetricsService } from '../observability/metrics.service';
import { PinoLogger } from 'nestjs-pino';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SendEmailDto } from './dto/send-email.dto';
import { EmailLog } from './email-log.entity';
import { User } from '../users/user.entity';

describe('EmailsService', () => {
    let service: EmailsService;
    let logger: PinoLogger;

    const mockConfigService = {
        get: jest.fn((key: string, defaultValue?: string) => {
            if (key === 'NODE_ENV') return 'development';
            if (key === 'SMTP_HOST') return undefined; // Simulate no SMTP
            return defaultValue;
        }),
    };

    const mockMetricsService = {
        incEmail: jest.fn(),
    };

    const mockLogger = {
        setContext: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    };

    const mockEmailLogsRepo = {
        create: jest.fn((payload: Partial<EmailLog>) => ({ id: 1, ...payload })),
        save: jest.fn(async (payload: Partial<EmailLog>) => ({
            id: 1,
            ...payload,
        })),
        update: jest.fn(async () => ({ affected: 1 })),
    };

    const mockUsersRepo = {
        findOne: jest.fn(async () => null),
    };

    beforeEach(async () => {
        jest.clearAllMocks();
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                EmailsService,
                { provide: ConfigService, useValue: mockConfigService },
                { provide: MetricsService, useValue: mockMetricsService },
                { provide: PinoLogger, useValue: mockLogger },
                {
                    provide: getRepositoryToken(EmailLog),
                    useValue: mockEmailLogsRepo,
                },
                {
                    provide: getRepositoryToken(User),
                    useValue: mockUsersRepo,
                },
            ],
        }).compile();

        service = module.get<EmailsService>(EmailsService);
        logger = module.get<PinoLogger>(PinoLogger);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should log email when SMTP is not configured in development', async () => {
        const dto: SendEmailDto = {
            to: 'test@example.com',
            subject: 'Test Subject',
            template: 'Hello {{name}}',
            data: { name: 'World' },
        };

        await service.send(dto);

        const warn = logger.warn as unknown as jest.Mock;
        expect(warn).toHaveBeenCalledWith(
            expect.objectContaining({
                to: dto.to,
                subject: dto.subject,
                template: dto.template,
                data: dto.data,
            }),
            'Email logged (SMTP not configured)',
        );
        expect(mockMetricsService.incEmail).toHaveBeenCalledWith('success');
    });
});
