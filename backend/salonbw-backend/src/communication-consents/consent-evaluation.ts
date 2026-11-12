import {
    CommunicationChannel,
    CommunicationClass,
    CommunicationType,
    ConsentPurpose,
    ConsentStatus,
    EligibilityReason,
    LEGACY_MARKETING_COLUMN,
    LEGACY_OPERATIONAL_COLUMN,
    getTypeDefinition,
} from './communication-consent.types';

export interface LegacyCustomerFlags {
    receiveNotifications: boolean;
    notifyPanel: boolean;
    notifySms: boolean;
    notifyEmail: boolean;
    notifyWhatsapp: boolean;
    smsConsent: boolean;
    emailConsent: boolean;
    whatsappConsent: boolean;
    /** Current destination, needed to bind WhatsApp recipient opt-in. */
    phone?: string | null;
}

export interface ConsentLike {
    purpose: ConsentPurpose;
    channel: CommunicationChannel;
    status: ConsentStatus;
    /** Captured phone number for phone-bound service WhatsApp opt-in. */
    contactValue?: string | null;
}

export interface PreferenceLike {
    communicationType: CommunicationType;
    channel: CommunicationChannel;
    enabled: boolean;
}

export type PreferenceSource = 'EXPLICIT' | 'LEGACY_DEFAULT' | 'DEFAULT';

export interface PreferenceEvaluation {
    communicationType: CommunicationType;
    channel: CommunicationChannel;
    communicationClass: CommunicationClass;
    supported: boolean;
    preferred: boolean | null;
    preferenceSource: PreferenceSource | null;
    consentStatus: ConsentStatus;
    /** Legacy boolean set but no audited consent exists. */
    legacyUnverifiedConsent: boolean;
    effectiveAllowed: boolean;
    reason: EligibilityReason;
}

/** Normalize formatting only; never match a different phone by last digits. */
export function normalizeWhatsAppNumber(phone: string | null | undefined): string | null {
    const digits = (phone ?? '').replace(/\D/g, '');
    return digits.length >= 9 && digits.length <= 15 ? digits : null;
}

/**
 * Pure decision function. Used for both the preference view and the send-time
 * eligibility check so the UI can never show a different answer than the
 * delivery path enforces.
 */
export function evaluatePreference(
    flags: LegacyCustomerFlags,
    consents: readonly ConsentLike[],
    preferences: readonly PreferenceLike[],
    type: CommunicationType,
    channel: CommunicationChannel,
): PreferenceEvaluation {
    const def = getTypeDefinition(type);
    const supported = def.supportedChannels.includes(channel);
    const base = {
        communicationType: type,
        channel,
        communicationClass: def.class,
        supported,
    };

    const explicit = preferences.find(
        (p) => p.communicationType === type && p.channel === channel,
    );

    let preferred: boolean | null = null;
    let preferenceSource: PreferenceSource | null = null;
    if (supported) {
        if (explicit) {
            preferred = explicit.enabled;
            preferenceSource = 'EXPLICIT';
        } else if (def.class === CommunicationClass.Operational) {
            preferred = Boolean(flags[LEGACY_OPERATIONAL_COLUMN[channel]]);
            preferenceSource = 'LEGACY_DEFAULT';
        } else {
            // Marketing: no objection by default; consent still decides.
            preferred = true;
            preferenceSource = 'DEFAULT';
        }
    }

    let consentStatus = ConsentStatus.NotApplicable;
    let legacyUnverifiedConsent = false;
    if (def.class === CommunicationClass.Marketing && def.purpose) {
        const row = consents.find(
            (c) => c.purpose === def.purpose && c.channel === channel,
        );
        if (row?.status === ConsentStatus.Granted) {
            consentStatus = ConsentStatus.Granted;
        } else if (row?.status === ConsentStatus.Withdrawn) {
            consentStatus = ConsentStatus.Withdrawn;
        } else {
            consentStatus = ConsentStatus.Unknown;
            const legacyColumn = LEGACY_MARKETING_COLUMN[channel];
            legacyUnverifiedConsent = Boolean(
                legacyColumn &&
                def.purpose === ConsentPurpose.DirectMarketing &&
                flags[legacyColumn],
            );
        }
    }

    const deny = (reason: EligibilityReason): PreferenceEvaluation => ({
        ...base,
        preferred,
        preferenceSource,
        consentStatus,
        legacyUnverifiedConsent,
        effectiveAllowed: false,
        reason,
    });

    if (!supported) return deny(EligibilityReason.ChannelNotSupported);

    if (def.class === CommunicationClass.Operational) {
        if (!flags.receiveNotifications) {
            return deny(EligibilityReason.NotificationsDisabled);
        }
        if (!preferred) return deny(EligibilityReason.PreferenceDisabled);
        if (channel === CommunicationChannel.WhatsApp) {
            const optIn = consents.find(
                (c) =>
                    c.purpose === ConsentPurpose.WhatsappAppointmentUpdates &&
                    c.channel === CommunicationChannel.WhatsApp,
            );
            if (optIn?.status === ConsentStatus.Withdrawn) {
                return deny(EligibilityReason.WhatsappOptInWithdrawn);
            }
            if (optIn?.status !== ConsentStatus.Granted) {
                return deny(EligibilityReason.WhatsappOptInMissing);
            }
            const number = normalizeWhatsAppNumber(flags.phone);
            if (!number || number !== optIn.contactValue) {
                return deny(EligibilityReason.WhatsappContactChanged);
            }
        }
        return {
            ...base,
            preferred,
            preferenceSource,
            consentStatus,
            legacyUnverifiedConsent,
            effectiveAllowed: true,
            reason: EligibilityReason.OperationalAllowed,
        };
    }

    if (consentStatus === ConsentStatus.Withdrawn) {
        return deny(EligibilityReason.MarketingConsentWithdrawn);
    }
    if (consentStatus !== ConsentStatus.Granted) {
        return deny(
            legacyUnverifiedConsent
                ? EligibilityReason.LegacyConsentUnverified
                : EligibilityReason.MarketingConsentMissing,
        );
    }
    if (channel === CommunicationChannel.WhatsApp && def.purpose) {
        const row = consents.find(
            (consent) =>
                consent.purpose === def.purpose &&
                consent.channel === CommunicationChannel.WhatsApp,
        );
        const number = normalizeWhatsAppNumber(flags.phone);
        if (!number || number !== row?.contactValue) {
            return deny(EligibilityReason.WhatsappContactChanged);
        }
    }
    if (preferred === false) return deny(EligibilityReason.PreferenceDisabled);
    return {
        ...base,
        preferred,
        preferenceSource,
        consentStatus,
        legacyUnverifiedConsent,
        effectiveAllowed: true,
        reason: EligibilityReason.MarketingConsentGranted,
    };
}
