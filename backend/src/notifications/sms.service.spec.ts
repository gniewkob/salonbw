import { Test, TestingModule } from '@nestjs/testing';
import { SmsService } from './sms.service';
import axios from 'axios';

describe('SmsService', () => {
    let service: SmsService;

    beforeEach(async () => {
        process.env.TWILIO_ACCOUNT_SID = 'AC123';
        process.env.TWILIO_AUTH_TOKEN = 'auth';
        process.env.TWILIO_FROM_NUMBER = '+111';
        const module: TestingModule = await Test.createTestingModule({
            providers: [SmsService],
        }).compile();
        service = module.get<SmsService>(SmsService);
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    it('sendSms posts to Twilio API', async () => {
        const postMock = jest
            .spyOn(axios, 'post')
            .mockResolvedValue({ data: {} } as any);
        await service.sendSms('+222', 'hi');
        expect(postMock).toHaveBeenCalledWith(
            'https://api.twilio.com/2010-04-01/Accounts/AC123/Messages.json',
            'To=%2B222&From=%2B111&Body=hi',
            {
                auth: { username: 'AC123', password: 'auth' },
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            },
        );
    });

    it('does nothing when notifications are disabled', async () => {
        const postMock = jest.spyOn(axios, 'post');
        process.env.NOTIFICATIONS_ENABLED = 'false';
        await service.sendSms('+222', 'hi');
        expect(postMock).not.toHaveBeenCalled();
        delete process.env.NOTIFICATIONS_ENABLED;
    });
});
