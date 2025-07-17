import { Injectable } from '@nestjs/common';

interface WhatsAppTextPayload {
    messaging_product: 'whatsapp';
    to: string;
    type: 'text';
    text: { body: string };
}

@Injectable()
export class NotificationsService {
    private readonly token = process.env.WHATSAPP_TOKEN;
    private readonly phoneId = process.env.WHATSAPP_PHONE_ID;
    private readonly baseUrl = 'https://graph.facebook.com/v18.0';

    async sendText(to: string, text: string) {
        if (!this.token || !this.phoneId) {
            throw new Error('WhatsApp credentials not configured');
        }
        const payload: WhatsAppTextPayload = {
            messaging_product: 'whatsapp',
            to,
            type: 'text',
            text: { body: text },
        };
        const res = await fetch(`${this.baseUrl}/${this.phoneId}/messages`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${this.token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });
        if (!res.ok) {
            const body = await res.text();
            throw new Error(`WhatsApp API error: ${res.status} ${body}`);
        }
        return res.json();
    }

    async sendAppointmentConfirmation(to: string, when: Date) {
        const text = `Twoja wizyta została umówiona na ${when.toLocaleString()}`;
        return this.sendText(to, text);
    }

    async sendAppointmentReminder(to: string, when: Date) {
        const text = `Przypomnienie: wizyta ${when.toLocaleString()}`;
        return this.sendText(to, text);
    }

    async sendThankYou(to: string) {
        const text = 'Dziękujemy za wizytę!';
        return this.sendText(to, text);
    }
}
