import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class WhatsappService {
    private readonly token: string;
    private readonly phoneId: string;

    constructor(
        private readonly http: HttpService,
        private readonly config: ConfigService,
    ) {
        this.token = this.config.get<string>('WHATSAPP_TOKEN')!;
        this.phoneId = this.config.get<string>('WHATSAPP_PHONE_ID')!;
    }

    async sendTemplate(
        to: string,
        templateName: string,
        params: string[],
    ): Promise<void> {
        const url = `https://graph.facebook.com/v17.0/${this.phoneId}/messages`;
        const body = {
            messaging_product: 'whatsapp',
            to,
            type: 'template',
            template: {
                name: templateName,
                language: { code: 'en_US' },
                components: [
                    {
                        type: 'body',
                        parameters: params.map((text) => ({
                            type: 'text',
                            text,
                        })),
                    },
                ],
            },
        };
        await firstValueFrom(
            this.http.post(url, body, {
                headers: { Authorization: `Bearer ${this.token}` },
            }),
        );
    }

    async sendBookingConfirmation(to: string, params: string[]): Promise<void> {
        await this.sendTemplate(to, 'booking_confirmation', params);
    }

    async sendReminder(to: string, params: string[]): Promise<void> {
        await this.sendTemplate(to, 'appointment_reminder', params);
    }

    async sendFollowUp(to: string, params: string[]): Promise<void> {
        await this.sendTemplate(to, 'follow_up', params);
    }
}
