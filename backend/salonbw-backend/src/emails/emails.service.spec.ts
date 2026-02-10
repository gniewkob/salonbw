import { Test, TestingModule } from '@nestjs/testing';
import { EmailsService } from './emails.service';
import { ConfigService } from '@nestjs/config';
import { MetricsService } from '../observability/metrics.service';
import { PinoLogger } from 'nestjs-pino';
import { SendEmailDto } from './dto/send-email.dto';

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

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                EmailsService,
                { provide: ConfigService, useValue: mockConfigService },
                { provide: MetricsService, useValue: mockMetricsService },
                { provide: PinoLogger, useValue: mockLogger },
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
