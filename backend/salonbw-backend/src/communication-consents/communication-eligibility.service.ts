import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { Role } from '../users/role.enum';
import {
    CommunicationChannel,
    CommunicationClass,
    CommunicationType,
    EligibilityReason,
    getTypeDefinition,
} from './communication-consent.types';
import { evaluatePreference, normalizeWhatsAppNumber } from './consent-evaluation';
import { CommunicationConsentsService } from './communication-consents.service';

export interface EligibilityDecision {
    allowed: boolean;
    reason: EligibilityReason;
    communicationType: CommunicationType;
    channel: CommunicationChannel;
    communicationClass: CommunicationClass;
    customerId: number | null;
    evaluatedAt: string;
}

export interface CanSendInput {
    customerId: number | null | undefined;
    communicationType: CommunicationType;
    channel: CommunicationChannel;
    /** Require a phone/e-mail on file for the channel. Default true. */
    requireContact?: boolean;
    /** Destination supplied to the provider; checked against the customer record. */
    recipientPhone?: string;
}

/**
 * Single decision point for customer-facing outbound communication.
 * Evaluated at dispatch time (never cached), so a withdrawal applies to every
 * subsequent or queued send. Classification comes from the server-side type
 * catalogue only.
 */
@Injectable()
export class CommunicationEligibilityService {
    private readonly logger = new Logger(CommunicationEligibilityService.name);

    constructor(
        private readonly consents: CommunicationConsentsService,
        @InjectRepository(User) private readonly users: Repository<User>,
    ) {}

    async canSend(input: CanSendInput): Promise<EligibilityDecision> {
        const def = getTypeDefinition(input.communicationType);
        const decide = (
            allowed: boolean,
            reason: EligibilityReason,
        ): EligibilityDecision => ({
            allowed,
            reason,
            communicationType: input.communicationType,
            channel: input.channel,
            communicationClass: def.class,
            customerId: input.customerId ?? null,
            evaluatedAt: new Date().toISOString(),
        });

        if (!input.customerId) {
            return decide(false, EligibilityReason.RecipientUnknown);
        }
        const { customer, consents, preferences } =
            await this.consents.loadForEligibility(input.customerId);
        if (!customer || customer.role !== Role.Client) {
            return decide(false, EligibilityReason.RecipientUnknown);
        }
        const evaluation = evaluatePreference(
            customer,
            consents,
            preferences,
            input.communicationType,
            input.channel,
        );
        if (!evaluation.effectiveAllowed) {
            return decide(false, evaluation.reason);
        }
        if (
            input.channel === CommunicationChannel.WhatsApp &&
            input.recipientPhone !== undefined &&
            (!normalizeWhatsAppNumber(customer.phone) ||
                normalizeWhatsAppNumber(customer.phone) !==
                    normalizeWhatsAppNumber(input.recipientPhone))
        ) {
            return decide(false, EligibilityReason.RecipientAddressMismatch);
        }
        if (input.requireContact !== false) {
            const hasContact =
                input.channel === CommunicationChannel.Email
                    ? Boolean(customer.email)
                    : input.channel === CommunicationChannel.Panel
                      ? true
                      : Boolean(customer.phone);
            if (!hasContact)
                return decide(false, EligibilityReason.ContactMissing);
        }
        return decide(true, evaluation.reason);
    }

    /**
     * Resolve a bare phone number (bulk / manual SMS) to exactly one customer.
     * Ambiguous or unknown numbers return null → marketing is denied.
     */
    async resolveCustomerByPhone(phone: string): Promise<number | null> {
        const digits = phone.replace(/\D/g, '');
        if (digits.length < 9) return null;
        const tail = digits.slice(-9);
        const rows = await this.users
            .createQueryBuilder('u')
            .select('u.id', 'id')
            .where('u.role = :role', { role: Role.Client })
            .andWhere(
                "right(regexp_replace(coalesce(u.phone, ''), '[^0-9]', '', 'g'), 9) = :tail",
                { tail },
            )
            .limit(2)
            .getRawMany<{ id: number }>();
        if (rows.length !== 1) {
            if (rows.length > 1) {
                this.logger.warn(
                    'Ambiguous phone match for outbound message; denying',
                );
            }
            return null;
        }
        return Number(rows[0].id);
    }

    async resolveCustomerByEmail(email: string): Promise<number | null> {
        const rows = await this.users
            .createQueryBuilder('u')
            .select('u.id', 'id')
            .where('u.role = :role', { role: Role.Client })
            .andWhere('lower(u.email) = lower(:email)', { email })
            .limit(2)
            .getRawMany<{ id: number }>();
        return rows.length === 1 ? Number(rows[0].id) : null;
    }
}
