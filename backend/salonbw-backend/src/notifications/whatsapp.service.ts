import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { isAxiosError } from 'axios';

@Injectable()
export class WhatsappService {
    private readonly token: string;
    private readonly phoneId: string;
    private readonly lang: string;
    private readonly enabled: boolean;

    constructor(
        private readonly http: HttpService,
        private readonly config: ConfigService,
    ) {
        // Prefer required envs when available; fall back gracefully if missing
        let token = '';
        let phoneId = '';
        try {
            token = this.config.getOrThrow<string>('WHATSAPP_TOKEN');
            phoneId = this.config.getOrThrow<string>('WHATSAPP_PHONE_ID');
        } catch {
            token = this.config.get<string>('WHATSAPP_TOKEN', '') ?? '';
            phoneId = this.config.get<string>('WHATSAPP_PHONE_ID', '') ?? '';
        }
        this.token = token;
        this.phoneId = phoneId;
        this.lang = this.config.get<string>('WHATSAPP_LANG', 'pl');
        this.enabled = Boolean(this.token && this.phoneId);

        if (!this.enabled) {
            console.warn(
                'WhatsApp notifications disabled: missing WHATSAPP_TOKEN or WHATSAPP_PHONE_ID',
            );
        }
    }

    async sendTemplate(
        to: string,
        templateName: string,
        params: string[],
    ): Promise<void> {
        if (!this.enabled) {
            return;
        }

        const url = `https://graph.facebook.com/v17.0/${this.phoneId}/messages`;
        const body = {
            messaging_product: 'whatsapp',
            to,
            type: 'template',
            template: {
                name: templateName,
                language: { code: this.lang },
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
                        headers: {
                            Authorization: `Bearer ${this.token}`,
                            'Content-Type': 'application/json',
                        },
                    }),
                );
                return;
            } catch (error: unknown) {
                if (isAxiosError(error)) {
                    console.error(
                        'Failed to send WhatsApp message',
                        error.response?.data,
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

    async sendBookingConfirmation(
        to: string,
        date: string,
        time: string,
    ): Promise<void> {
        await this.sendTemplate(to, 'booking_confirmation', [date, time]);
    }

    async sendReminder(to: string, date: string, time: string): Promise<void> {
        await this.sendTemplate(to, 'appointment_reminder', [date, time]);
    }

    async sendFollowUp(to: string, date: string, time: string): Promise<void> {
        await this.sendTemplate(to, 'follow_up', [date, time]);
    }
}
