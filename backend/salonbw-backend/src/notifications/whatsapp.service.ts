import { outboundDeliveryEnabled } from '../environment-isolation';
import { Injectable, Logger, Optional } from '@nestjs/common';
import { CommunicationEligibilityService } from '../communication-consents/communication-eligibility.service';
import {
    CommunicationChannel,
    CommunicationType,
} from '../communication-consents/communication-consent.types';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { isAxiosError } from 'axios';

@Injectable()
export class WhatsappService {
    private readonly logger = new Logger(WhatsappService.name);
    private readonly token: string;
    private readonly phoneId: string;
    private readonly lang: string;
    private readonly enabled: boolean;

    constructor(
        private readonly http: HttpService,
        private readonly config: ConfigService,
        @Optional()
        private readonly eligibility?: CommunicationEligibilityService,
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
        this.enabled =
            outboundDeliveryEnabled() && Boolean(this.token && this.phoneId);

        if (!this.enabled) {
            this.logger.warn(
                'WhatsApp notifications disabled: missing WHATSAPP_TOKEN or WHATSAPP_PHONE_ID',
            );
        }
    }

    /**
     * Customer dispatch gate: always re-evaluate identity and permission at
     * the last service boundary, never rely only on the caller or UI state.
     */
    private async sendCustomerTemplate(
        customerId: number,
        to: string,
        communicationType: CommunicationType,
        templateName: string,
        params: string[],
    ): Promise<boolean> {
        if (
            !this.enabled ||
            !Number.isInteger(customerId) ||
            !this.eligibility
        ) {
            return false;
        }
        try {
            const decision = await this.eligibility.canSend({
                customerId,
                communicationType,
                channel: CommunicationChannel.WhatsApp,
                recipientPhone: to,
            });
            if (!decision.allowed) {
                this.logger.debug(
                    `WhatsApp customer send denied: ${decision.reason} (customer ${customerId})`,
                );
                return false;
            }
        } catch (error) {
            this.logger.warn(
                `WhatsApp eligibility could not be verified for customer ${customerId}: ${String(error)}`,
            );
            return false;
        }
        return this.sendTemplate(to, templateName, params);
    }

    /** Low-level Meta adapter. Call only after the customer gate or for staff. */
    private async sendTemplate(
        to: string,
        templateName: string,
        params: string[],
    ): Promise<boolean> {
        if (!this.enabled) {
            return false;
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
                return true;
            } catch (error: unknown) {
                if (isAxiosError(error)) {
                    this.logger.error(
                        { error: error.response?.data as unknown },
                        'Failed to send WhatsApp message',
                    );
                } else {
                    this.logger.error(
                        { error },
                        'Failed to send WhatsApp message',
                    );
                }
                if (attempt < retries - 1) {
                    await delay(1000);
                }
            }
        }
        // Failure is not delivery. Callers may use an independently permitted fallback.
        return false;
    }

    async sendBookingConfirmation(
        to: string,
        date: string,
        time: string,
        customerId: number,
    ): Promise<boolean> {
        return this.sendCustomerTemplate(
            customerId,
            to,
            CommunicationType.BookingConfirmation,
            'booking_confirmation',
            [date, time],
        );
    }

    async sendReminder(
        to: string,
        date: string,
        time: string,
        customerId: number,
    ): Promise<boolean> {
        return this.sendCustomerTemplate(
            customerId,
            to,
            CommunicationType.AppointmentReminder,
            'appointment_reminder',
            [date, time],
        );
    }

    async sendFollowUp(
        to: string,
        date: string,
        time: string,
        customerId: number,
    ): Promise<boolean> {
        return this.sendCustomerTemplate(
            customerId,
            to,
            CommunicationType.PostVisitReview,
            'follow_up',
            [date, time],
        );
    }

    async sendNewBookingToEmployee(
        to: string,
        clientName: string,
        serviceName: string,
        date: string,
        time: string,
    ): Promise<boolean> {
        return this.sendTemplate(to, 'new_appointment_employee', [
            clientName,
            serviceName,
            date,
            time,
        ]);
    }

    async sendRescheduleNotification(
        to: string,
        date: string,
        time: string,
        customerId: number,
    ): Promise<boolean> {
        return this.sendCustomerTemplate(
            customerId,
            to,
            CommunicationType.AppointmentChange,
            'appointment_rescheduled',
            [date, time],
        );
    }
}
