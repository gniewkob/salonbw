/**
 * Typed contract for the unified consent & communication-preference API.
 * Mirrors backend/salonbw-backend/src/communication-consents. UI code should
 * depend on these types and the hooks in hooks/useCommunicationConsents.ts,
 * never on raw endpoints.
 */

export type CommunicationChannel = 'PANEL' | 'SMS' | 'EMAIL' | 'WHATSAPP';

export type CommunicationType =
    | 'BOOKING_CONFIRMATION'
    | 'APPOINTMENT_REMINDER'
    | 'APPOINTMENT_CHANGE'
    | 'APPOINTMENT_CANCELLATION'
    | 'MASS_MARKETING'
    | 'BIRTHDAY_WISHES'
    | 'MARKETING_AUTOMATION'
    | 'POST_VISIT_REVIEW'
    | 'NEWSLETTER'
    | 'REACTIVATION_CAMPAIGN';

export type CommunicationClass = 'OPERATIONAL' | 'MARKETING';

export type ConsentPurpose =
    | 'DIRECT_MARKETING'
    | 'NEWSLETTER'
    | 'REVIEW_REQUEST'
    | 'WHATSAPP_APPOINTMENT_UPDATES';

export type ConsentStatus =
    | 'GRANTED'
    | 'WITHDRAWN'
    | 'UNKNOWN'
    | 'NOT_APPLICABLE';

export type ConsentSource =
    | 'IN_PERSON_SIGNED_FORM'
    | 'ELECTRONIC_SIGNED_FORM'
    | 'EMAIL_CONFIRMATION'
    | 'RECORDED_PHONE_CALL'
    | 'STAFF_ON_CUSTOMER_REQUEST'
    | 'STAFF_PREFERENCE_UPDATE'
    | 'SELF_SERVICE_PANEL'
    | 'REGISTRATION'
    | 'LEGACY_SELF_SERVICE_FORM'
    | 'LEGACY_STAFF_FORM';

export type StaffGrantSource = Extract<
    ConsentSource,
    | 'IN_PERSON_SIGNED_FORM'
    | 'ELECTRONIC_SIGNED_FORM'
    | 'EMAIL_CONFIRMATION'
    | 'RECORDED_PHONE_CALL'
>;

export type EligibilityReason =
    | 'OPERATIONAL_ALLOWED'
    | 'MARKETING_CONSENT_GRANTED'
    | 'MARKETING_CONSENT_MISSING'
    | 'MARKETING_CONSENT_WITHDRAWN'
    | 'LEGACY_CONSENT_UNVERIFIED'
    | 'PREFERENCE_DISABLED'
    | 'NOTIFICATIONS_DISABLED'
    | 'CHANNEL_NOT_SUPPORTED'
    | 'RECIPIENT_UNKNOWN'
    | 'CONTACT_MISSING'
    | 'WHATSAPP_OPT_IN_MISSING'
    | 'WHATSAPP_OPT_IN_WITHDRAWN'
    | 'WHATSAPP_CONTACT_CHANGED';

export interface CommunicationCatalog {
    channels: CommunicationChannel[];
    types: {
        type: CommunicationType;
        class: CommunicationClass;
        purpose: ConsentPurpose | null;
        label: string;
        supportedChannels: CommunicationChannel[];
    }[];
    consentScopes: {
        purpose: ConsentPurpose;
        channel: CommunicationChannel;
        label: string;
        textVersion: string;
        text: string;
        /** Wording pending owner/legal approval. */
        draft: boolean;
    }[];
    staffGrantSources: StaffGrantSource[];
}

export interface ConsentScopeView {
    purpose: ConsentPurpose;
    channel: CommunicationChannel;
    label: string;
    status: Exclude<ConsentStatus, 'NOT_APPLICABLE'>;
    /** Legacy boolean set, but no audited consent: NOT valid for marketing. */
    legacyUnverifiedConsent: boolean;
    currentTextVersion: string;
    recordedAt: string | null;
    effectiveAt: string | null;
    source: ConsentSource | null;
    consentTextVersion: string | null;
    /** Staff view only. */
    evidenceReference?: string | null;
    actorRole: string | null;
}

export interface CommunicationPreferenceView {
    communicationType: CommunicationType;
    channel: CommunicationChannel;
    communicationClass: CommunicationClass;
    supported: boolean;
    /** null when unsupported. */
    preferred: boolean | null;
    preferenceSource: 'EXPLICIT' | 'LEGACY_DEFAULT' | 'DEFAULT' | null;
    consentStatus: ConsentStatus;
    legacyUnverifiedConsent: boolean;
    effectiveAllowed: boolean;
    reason: EligibilityReason;
}

export interface CommunicationState {
    customerId: number;
    receiveNotifications: boolean;
    contact: { hasPhone: boolean; hasEmail: boolean };
    consents: ConsentScopeView[];
    preferences: CommunicationPreferenceView[];
    updatedAt: string;
}

export interface ConsentHistoryItem {
    id: number;
    occurredAt: string;
    eventType:
        | 'GRANTED'
        | 'WITHDRAWN'
        | 'PREFERENCE_ENABLED'
        | 'PREFERENCE_DISABLED';
    purpose: ConsentPurpose | null;
    communicationType: CommunicationType | null;
    channel: CommunicationChannel;
    previousStatus: string | null;
    newStatus: string;
    source: ConsentSource;
    consentTextVersion: string | null;
    actorRole: string;
    performedBySelf: boolean;
    /** Staff view only. */
    actorId?: number | null;
    actorName?: string | null;
    evidenceReference?: string | null;
}

/** Pre-existing best-effort log entries (staff view, page 1 only). */
export interface LegacyConsentHistoryItem {
    id: string;
    timestamp: string;
    field: string;
    previous: boolean;
    current: boolean;
    actorId: number | null;
}

export interface ConsentHistoryPage {
    items: ConsentHistoryItem[];
    total: number;
    page: number;
    limit: number;
    legacyItems: LegacyConsentHistoryItem[];
}

export interface GrantConsentInput {
    purpose: ConsentPurpose;
    channel: CommunicationChannel;
    consentTextVersion: string;
    /** Staff only (required for staff). */
    source?: StaffGrantSource;
    /** Staff only (required for staff, 3–500 chars). */
    evidenceReference?: string;
    /** Staff only, ISO date ≤ now. */
    consentGivenAt?: string;
}

export interface WithdrawConsentInput {
    purpose: ConsentPurpose;
    channel: CommunicationChannel;
}

/** Atomic opt-out; never grants any channel or changes service notifications. */
export interface WithdrawDirectMarketingInput {
    channels: Extract<CommunicationChannel, 'SMS' | 'WHATSAPP' | 'EMAIL'>[];
}

export interface PreferenceChange {
    communicationType: CommunicationType;
    channel: CommunicationChannel;
    enabled: boolean;
}

/** `communication` field of POST /customers. */
export interface InitialCommunicationSetup {
    grants?: {
        purpose: ConsentPurpose;
        channel: CommunicationChannel;
        consentTextVersion: string;
    }[];
    source?: StaffGrantSource;
    evidenceReference?: string;
    preferences?: PreferenceChange[];
}

/** Whose communication settings are addressed. */
export type CommunicationScope =
    | { kind: 'customer'; customerId: number }
    | { kind: 'self' };

export function communicationPaths(scope: CommunicationScope) {
    const base =
        scope.kind === 'self'
            ? '/users/profile'
            : `/customers/${scope.customerId}`;
    return {
        state: `${base}/communication-preferences`,
        history: `${base}/consent-history`,
        grant: `${base}/consents/grant`,
        withdraw: `${base}/consents/withdraw`,
        withdrawDirectMarketing: `${base}/consents/withdraw-direct-marketing`,
    };
}

export const CATALOG_PATH = '/communication-consents/catalog';

export const CHANNEL_LABELS: Record<CommunicationChannel, string> = {
    PANEL: 'Panel',
    SMS: 'SMS',
    EMAIL: 'E-mail',
    WHATSAPP: 'WhatsApp',
};

export const STAFF_SOURCE_LABELS: Record<StaffGrantSource, string> = {
    IN_PERSON_SIGNED_FORM: 'Podpisany formularz w salonie',
    ELECTRONIC_SIGNED_FORM: 'Formularz elektroniczny',
    EMAIL_CONFIRMATION: 'Potwierdzenie e-mail od klienta',
    RECORDED_PHONE_CALL: 'Nagrana rozmowa telefoniczna',
};

export const SOURCE_LABELS: Record<ConsentSource, string> = {
    ...STAFF_SOURCE_LABELS,
    STAFF_ON_CUSTOMER_REQUEST: 'Na prośbę klienta (personel)',
    STAFF_PREFERENCE_UPDATE: 'Zmiana przez personel',
    SELF_SERVICE_PANEL: 'Panel klienta',
    REGISTRATION: 'Rejestracja konta',
    LEGACY_SELF_SERVICE_FORM: 'Panel klienta (stary formularz)',
    LEGACY_STAFF_FORM: 'Formularz personelu (stary)',
};

export const REASON_LABELS: Record<EligibilityReason, string> = {
    OPERATIONAL_ALLOWED: 'Można wysłać',
    MARKETING_CONSENT_GRANTED: 'Można wysłać (zgoda)',
    MARKETING_CONSENT_MISSING: 'Brak zgody',
    MARKETING_CONSENT_WITHDRAWN: 'Zgoda wycofana',
    LEGACY_CONSENT_UNVERIFIED: 'Stara zgoda bez dowodu',
    PREFERENCE_DISABLED: 'Wyłączone przez preferencję',
    NOTIFICATIONS_DISABLED: 'Powiadomienia wyłączone',
    CHANNEL_NOT_SUPPORTED: 'Kanał niedostępny',
    RECIPIENT_UNKNOWN: 'Nieznany odbiorca',
    CONTACT_MISSING: 'Brak danych kontaktowych',
    WHATSAPP_OPT_IN_MISSING: 'Brak potwierdzonego opt-in WhatsApp',
    WHATSAPP_OPT_IN_WITHDRAWN: 'Kontakt WhatsApp wycofany',
    WHATSAPP_CONTACT_CHANGED: 'Numer telefonu zmieniony — potwierdź ponownie',
};

export const CONSENT_STATUS_LABELS: Record<ConsentStatus, string> = {
    GRANTED: 'Udzielona',
    WITHDRAWN: 'Wycofana',
    UNKNOWN: 'Brak',
    NOT_APPLICABLE: 'Nie dotyczy',
};

export function newIdempotencyKey(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
        return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
