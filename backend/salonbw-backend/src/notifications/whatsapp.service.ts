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
        this.token = this.config.getOrThrow<string>('WHATSAPP_TOKEN');
        this.phoneId = this.config.getOrThrow<string>('WHATSAPP_PHONE_ID');
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
        const retries = 3;
        const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));
        for (let attempt = 0; attempt < retries; attempt++) {
            try {
                await firstValueFrom(
                    this.http.post(url, body, {
                        headers: { Authorization: `Bearer ${this.token}` },
                    }),
                );
                return;
            } catch (error: unknown) {
                if (typeof error === 'object' && error && 'response' in error) {
                    const response = (error as { response?: { data?: unknown } })
                        .response;
                    console.error(
                        'Failed to send WhatsApp message',
                        response?.data,
                    );
                } else {
                    console.error('Failed to send WhatsApp message', error);
                }
                if (attempt < retries - 1) {
                    await delay(1000);
                }
            }
        }
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
