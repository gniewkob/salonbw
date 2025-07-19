import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailsService } from './emails.service';
import { EmailLog, EmailStatus } from './email-log.entity';
import { EmailOptOut } from './email-optout.entity';
import * as sgMail from '@sendgrid/mail';

jest.mock('@sendgrid/mail');

describe('EmailsService', () => {
    let service: EmailsService;
    let logs: {
        create: jest.Mock;
        save: jest.Mock;
        find: jest.Mock;
        findOne: jest.Mock;
    };
    let optouts: { findOne: jest.Mock; save: jest.Mock };

    beforeEach(async () => {
        logs = {
            create: jest.fn((x) => x),
            save: jest.fn(async (x) => x),
            find: jest.fn(),
            findOne: jest.fn(),
        } as any;
        optouts = { findOne: jest.fn(), save: jest.fn() } as any;
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                EmailsService,
                { provide: getRepositoryToken(EmailLog), useValue: logs },
                { provide: getRepositoryToken(EmailOptOut), useValue: optouts },
            ],
        }).compile();
        service = module.get<EmailsService>(EmailsService);
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    it('sends email via sendgrid', async () => {
        (sgMail.send as jest.Mock).mockResolvedValue({});
        optouts.findOne.mockResolvedValue(null);
        await service.sendEmail({
            to: 'a@test.com',
            subject: 'Hi',
            template: 'X',
            data: { name: 'A' },
        });
        expect(sgMail.send).toHaveBeenCalled();
        expect(logs.save).toHaveBeenCalled();
    });

    it('marks failed on error', async () => {
        (sgMail.send as jest.Mock).mockRejectedValue(new Error('fail'));
        optouts.findOne.mockResolvedValue(null);
        const res = (await service.sendEmail({
            to: 'a@test.com',
            subject: 'Hi',
            template: 'X',
            data: {},
        })) as EmailLog;
        expect(res.status).toBe(EmailStatus.Failed);
    });

    it('skips when opted out', async () => {
        optouts.findOne.mockResolvedValue({});
        const res = (await service.sendEmail({
            to: 'a@test.com',
            subject: 'Hi',
            template: 'X',
            data: {},
        })) as EmailLog;
        expect(res.status).toBe(EmailStatus.Skipped);
        expect(sgMail.send).not.toHaveBeenCalled();
    });
});
