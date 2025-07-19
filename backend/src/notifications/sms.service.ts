import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class SmsService {
    private readonly accountSid = process.env.TWILIO_ACCOUNT_SID;
    private readonly authToken = process.env.TWILIO_AUTH_TOKEN;
    private readonly fromNumber = process.env.TWILIO_FROM_NUMBER;

    async sendSms(to: string, body: string) {
        if (process.env.NOTIFICATIONS_ENABLED === 'false') {
            return;
        }
        if (!this.accountSid || !this.authToken || !this.fromNumber) {
            throw new Error('Twilio credentials not configured');
        }
        const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;
        const params = new URLSearchParams({
            To: to,
            From: this.fromNumber,
            Body: body,
        });
        await axios.post(url, params.toString(), {
            auth: { username: this.accountSid, password: this.authToken },
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
    }
}
