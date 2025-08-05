import { Injectable } from '@nestjs/common';
import axios from 'axios';

interface WhatsAppTextPayload {
    messaging_product: 'whatsapp';
    to: string;
    type: 'text';
    text: { body: string };
}

interface WhatsAppTemplatePayload {
    messaging_product: 'whatsapp';
    to: string;
    type: 'template';
    template: {
        name: string;
        language: { code: string };
        components: {
            type: 'body';
            parameters: { type: 'text'; text: string }[];
        }[];
    };
}

@Injectable()
export class WhatsappService {
    private readonly token = process.env.WHATSAPP_TOKEN;
    private readonly phoneId = process.env.WHATSAPP_PHONE_ID;
    private readonly baseUrl = 'https://graph.facebook.com/v18.0';

    async sendText(to: string, text: string) {
        if (process.env.NOTIFICATIONS_ENABLED === 'false') {
            return;
        }
        if (!this.token || !this.phoneId) {
            throw new Error('WhatsApp credentials not configured');
        }
        const payload: WhatsAppTextPayload = {
            messaging_product: 'whatsapp',
            to,
            type: 'text',
            text: { body: text },
        };
        try {
            const res = await axios.post(
                `${this.baseUrl}/${this.phoneId}/messages`,
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${this.token}`,
                        'Content-Type': 'application/json',
                    },
                },
            );
            return res.data;
        } catch (err: any) {
            const status = err.response?.status;
            const body = err.response?.data;
            throw new Error(`WhatsApp API error: ${status} ${body}`);
        }
    }

    async sendWhatsAppTemplate(
        to: string,
        templateName: string,
        parameters: string[],
    ) {
        if (process.env.NOTIFICATIONS_ENABLED === 'false') {
            return;
        }
        if (!this.token || !this.phoneId) {
            throw new Error('WhatsApp credentials not configured');
        }
        const lang = process.env.WHATSAPP_TEMPLATE_LANG || 'pl';
        const payload: WhatsAppTemplatePayload = {
            messaging_product: 'whatsapp',
            to,
            type: 'template',
            template: {
                name: templateName,
                language: { code: lang },
                components: [
                    {
                        type: 'body',
                        parameters: parameters.map((text) => ({
                            type: 'text',
                            text,
                        })),
                    },
                ],
            },
        };
        try {
            const res = await axios.post(
                `${this.baseUrl}/${this.phoneId}/messages`,
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${this.token}`,
                        'Content-Type': 'application/json',
                    },
                },
            );
            return res.data;
        } catch (err: any) {
            const status = err.response?.status;
            const body = err.response?.data;
            throw new Error(`WhatsApp API error: ${status} ${body}`);
        }
    }

}
