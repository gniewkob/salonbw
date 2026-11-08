/**
 * Unified customer consent & communication-preference domain.
 *
 * Four separate concepts — never interchangeable:
 *  1. Marketing consent   (customer_consents, per purpose × channel)
 *  2. Preferences         (communication_preferences, per type × channel)
 *  3. History             (consent_events, append-only)
 *  4. Effective eligibility (CommunicationEligibilityService, derived)
 *
 * All values are stored as varchar guarded by CHECK constraints (not native
 * PostgreSQL enums) so adding a value is a code + CHECK change instead of an
 * ALTER TYPE migration that has drifted in this repo before.
 */

export enum CommunicationChannel {
    Panel = 'PANEL',
    Sms = 'SMS',
    Email = 'EMAIL',
    WhatsApp = 'WHATSAPP',
}

export enum CommunicationType {
    BookingConfirmation = 'BOOKING_CONFIRMATION',
    AppointmentReminder = 'APPOINTMENT_REMINDER',
    AppointmentChange = 'APPOINTMENT_CHANGE',
    AppointmentCancellation = 'APPOINTMENT_CANCELLATION',
    MassMarketing = 'MASS_MARKETING',
    BirthdayWishes = 'BIRTHDAY_WISHES',
    MarketingAutomation = 'MARKETING_AUTOMATION',
    PostVisitReview = 'POST_VISIT_REVIEW',
    Newsletter = 'NEWSLETTER',
    ReactivationCampaign = 'REACTIVATION_CAMPAIGN',
}

/** Purpose a marketing consent is given for. */
export enum ConsentPurpose {
    DirectMarketing = 'DIRECT_MARKETING',
    Newsletter = 'NEWSLETTER',
    ReviewRequest = 'REVIEW_REQUEST',
    /** Recipient opt-in for WhatsApp appointment notifications, separate from marketing. */
    WhatsappAppointmentUpdates = 'WHATSAPP_APPOINTMENT_UPDATES',
}

export enum ConsentStatus {
    Granted = 'GRANTED',
    Withdrawn = 'WITHDRAWN',
    /** No evidence recorded. Never permits marketing. */
    Unknown = 'UNKNOWN',
    NotApplicable = 'NOT_APPLICABLE',
}

export enum CommunicationClass {
    /** Contract / service performance (appointments). */
    Operational = 'OPERATIONAL',
    /** Requires recorded consent for the purpose × channel. */
    Marketing = 'MARKETING',
}

export enum ConsentEventType {
    Granted = 'GRANTED',
    Withdrawn = 'WITHDRAWN',
    PreferenceEnabled = 'PREFERENCE_ENABLED',
    PreferenceDisabled = 'PREFERENCE_DISABLED',
}

export enum ConsentSource {
    // Staff-recorded grants — require an evidence reference.
    InPersonSignedForm = 'IN_PERSON_SIGNED_FORM',
    ElectronicSignedForm = 'ELECTRONIC_SIGNED_FORM',
    EmailConfirmation = 'EMAIL_CONFIRMATION',
    RecordedPhoneCall = 'RECORDED_PHONE_CALL',
    // Staff actions that need no evidence of the customer's consent.
    StaffOnCustomerRequest = 'STAFF_ON_CUSTOMER_REQUEST',
    StaffPreferenceUpdate = 'STAFF_PREFERENCE_UPDATE',
    // Customer acting for themselves.
    SelfServicePanel = 'SELF_SERVICE_PANEL',
    Registration = 'REGISTRATION',
    // Legacy endpoints kept for compatibility (old panel/account forms).
    LegacySelfServiceForm = 'LEGACY_SELF_SERVICE_FORM',
    LegacyStaffForm = 'LEGACY_STAFF_FORM',
}

export const STAFF_GRANT_SOURCES: readonly ConsentSource[] = [
    ConsentSource.InPersonSignedForm,
    ConsentSource.ElectronicSignedForm,
    ConsentSource.EmailConfirmation,
    ConsentSource.RecordedPhoneCall,
];

export enum EligibilityReason {
    OperationalAllowed = 'OPERATIONAL_ALLOWED',
    MarketingConsentGranted = 'MARKETING_CONSENT_GRANTED',
    MarketingConsentMissing = 'MARKETING_CONSENT_MISSING',
    MarketingConsentWithdrawn = 'MARKETING_CONSENT_WITHDRAWN',
    LegacyConsentUnverified = 'LEGACY_CONSENT_UNVERIFIED',
    PreferenceDisabled = 'PREFERENCE_DISABLED',
    NotificationsDisabled = 'NOTIFICATIONS_DISABLED',
    ChannelNotSupported = 'CHANNEL_NOT_SUPPORTED',
    RecipientUnknown = 'RECIPIENT_UNKNOWN',
    ContactMissing = 'CONTACT_MISSING',
    RecipientAddressMismatch = 'RECIPIENT_ADDRESS_MISMATCH',
    WhatsappOptInMissing = 'WHATSAPP_OPT_IN_MISSING',
    WhatsappOptInWithdrawn = 'WHATSAPP_OPT_IN_WITHDRAWN',
    WhatsappContactChanged = 'WHATSAPP_CONTACT_CHANGED',
}

export interface CommunicationTypeDefinition {
    type: CommunicationType;
    class: CommunicationClass;
    /** Required consent purpose for marketing-class types. */
    purpose: ConsentPurpose | null;
    label: string;
    /** Channels the backend can actually deliver for this type today. */
    supportedChannels: readonly CommunicationChannel[];
}

const C = CommunicationChannel;

/**
 * Server-side classification. Callers never choose the class; it is derived
 * from the type. POST_VISIT_REVIEW is treated as marketing (conservative;
 * owner/lawyer decision pending — see docs).
 *
 * supportedChannels reflects real delivery code paths:
 *  - SMS: SmsService (SMSAPI) — manual, template, automatic messages, reminders
 *  - EMAIL: EmailsService — reminders, appointment notices, staff e-mail
 *  - WHATSAPP: WhatsappService — booking confirmation, reschedule, follow-up
 *  - PANEL: in-app client dashboard notices for appointments only
 *  Newsletter delivery is not implemented (NewslettersService does not send),
 *  so NEWSLETTER has no supported channel yet.
 */
export const COMMUNICATION_TYPES: readonly CommunicationTypeDefinition[] = [
    {
        type: CommunicationType.BookingConfirmation,
        class: CommunicationClass.Operational,
        purpose: null,
        label: 'Potwierdzenie rezerwacji',
        supportedChannels: [C.Panel, C.Sms, C.Email, C.WhatsApp],
    },
    {
        type: CommunicationType.AppointmentReminder,
        class: CommunicationClass.Operational,
        purpose: null,
        label: 'Przypomnienie o wizycie',
        supportedChannels: [C.Sms, C.Email],
    },
    {
        type: CommunicationType.AppointmentChange,
        class: CommunicationClass.Operational,
        purpose: null,
        label: 'Zmiana terminu wizyty',
        supportedChannels: [C.Panel, C.Sms, C.Email, C.WhatsApp],
    },
    {
        type: CommunicationType.AppointmentCancellation,
        class: CommunicationClass.Operational,
        purpose: null,
        label: 'Odwołanie wizyty',
        supportedChannels: [C.Panel, C.Sms, C.Email],
    },
    {
        type: CommunicationType.MassMarketing,
        class: CommunicationClass.Marketing,
        purpose: ConsentPurpose.DirectMarketing,
        label: 'Wiadomości marketingowe i promocje',
        supportedChannels: [C.Sms, C.Email],
    },
    {
        type: CommunicationType.BirthdayWishes,
        class: CommunicationClass.Marketing,
        purpose: ConsentPurpose.DirectMarketing,
        label: 'Życzenia i oferty urodzinowe',
        supportedChannels: [C.Sms],
    },
    {
        type: CommunicationType.MarketingAutomation,
        class: CommunicationClass.Marketing,
        purpose: ConsentPurpose.DirectMarketing,
        label: 'Automatyczne oferty',
        supportedChannels: [C.Sms],
    },
    {
        type: CommunicationType.PostVisitReview,
        class: CommunicationClass.Marketing,
        purpose: ConsentPurpose.ReviewRequest,
        label: 'Prośba o opinię po wizycie',
        supportedChannels: [C.Sms, C.WhatsApp],
    },
    {
        type: CommunicationType.Newsletter,
        class: CommunicationClass.Marketing,
        purpose: ConsentPurpose.Newsletter,
        label: 'Newsletter',
        supportedChannels: [],
    },
    {
        type: CommunicationType.ReactivationCampaign,
        class: CommunicationClass.Marketing,
        purpose: ConsentPurpose.DirectMarketing,
        label: 'Kampanie powrotu',
        supportedChannels: [C.Sms],
    },
];

export function getTypeDefinition(
    type: CommunicationType,
): CommunicationTypeDefinition {
    const def = COMMUNICATION_TYPES.find((d) => d.type === type);
    if (!def) throw new Error(`Unknown communication type ${type}`);
    return def;
}

export interface ConsentScopeDefinition {
    purpose: ConsentPurpose;
    channel: CommunicationChannel;
    label: string;
    /** Current consent statement version required to grant. */
    textVersion: string;
}

/**
 * Consent statements. Wording is a DRAFT pending owner/legal approval; the
 * version string is stored with every grant so a later wording change does
 * not silently re-label historical consents.
 */
/** Exact registration statement, reused as evidence for each named channel. */
export const REGISTRATION_DIRECT_MARKETING_TEXT_VERSION =
    'direct-marketing-bundle-v1-draft';
export const REGISTRATION_DIRECT_MARKETING_TEXT =
    'Wyrażam zgodę na otrzymywanie od Salon Black & White informacji handlowych (ofert i promocji) przez e-mail, SMS i WhatsApp na podane dane kontaktowe. Mogę w każdej chwili wycofać zgodę lub ograniczyć poszczególne kanały w ustawieniach komunikacji.';

export const CONSENT_TEXTS: Record<string, string> = {
    [REGISTRATION_DIRECT_MARKETING_TEXT_VERSION]:
        REGISTRATION_DIRECT_MARKETING_TEXT,
    'direct-marketing-sms-v1-draft':
        'Wyrażam zgodę na otrzymywanie od Salon Black & White informacji handlowych (promocje, oferty) wiadomościami SMS na podany numer telefonu. Zgodę mogę w każdej chwili wycofać.',
    'direct-marketing-email-v1-draft':
        'Wyrażam zgodę na otrzymywanie od Salon Black & White informacji handlowych (promocje, oferty) na podany adres e-mail. Zgodę mogę w każdej chwili wycofać.',
    'direct-marketing-whatsapp-v1-draft':
        'Wyrażam zgodę na otrzymywanie od Salon Black & White informacji handlowych (promocje, oferty) przez WhatsApp na podany numer telefonu. Zgodę mogę w każdej chwili wycofać.',
    'newsletter-email-v1-draft':
        'Chcę otrzymywać newsletter Salon Black & White na podany adres e-mail. Mogę zrezygnować w każdej chwili.',
    'review-request-sms-v1-draft':
        'Wyrażam zgodę na otrzymywanie SMS z prośbą o ocenę wizyty. Zgodę mogę w każdej chwili wycofać.',
    'review-request-whatsapp-v1-draft':
        'Wyrażam zgodę na otrzymywanie przez WhatsApp prośby o ocenę wizyty. Zgodę mogę w każdej chwili wycofać.',
    'whatsapp-appointments-v1-draft':
        'Chcę otrzymywać od Salon Black & White wiadomości WhatsApp dotyczące moich wizyt (potwierdzenia i zmiany terminów) na podany numer telefonu. Mogę w dowolnym momencie wycofać zgodę w ustawieniach komunikacji. Nie obejmuje to ofert i promocji.',
};

export const CONSENT_SCOPES: readonly ConsentScopeDefinition[] = [
    {
        purpose: ConsentPurpose.WhatsappAppointmentUpdates,
        channel: C.WhatsApp,
        label: 'WhatsApp — informacje o wizytach',
        textVersion: 'whatsapp-appointments-v1-draft',
    },
    {
        purpose: ConsentPurpose.DirectMarketing,
        channel: C.Sms,
        label: 'Marketing — SMS',
        textVersion: 'direct-marketing-sms-v1-draft',
    },
    {
        purpose: ConsentPurpose.DirectMarketing,
        channel: C.Email,
        label: 'Marketing — e-mail',
        textVersion: 'direct-marketing-email-v1-draft',
    },
    {
        purpose: ConsentPurpose.DirectMarketing,
        channel: C.WhatsApp,
        label: 'Marketing — WhatsApp',
        textVersion: 'direct-marketing-whatsapp-v1-draft',
    },
    {
        purpose: ConsentPurpose.Newsletter,
        channel: C.Email,
        label: 'Newsletter — e-mail',
        textVersion: 'newsletter-email-v1-draft',
    },
    {
        purpose: ConsentPurpose.ReviewRequest,
        channel: C.Sms,
        label: 'Prośba o opinię — SMS',
        textVersion: 'review-request-sms-v1-draft',
    },
    {
        purpose: ConsentPurpose.ReviewRequest,
        channel: C.WhatsApp,
        label: 'Prośba o opinię — WhatsApp',
        textVersion: 'review-request-whatsapp-v1-draft',
    },
];

export function findConsentScope(
    purpose: ConsentPurpose,
    channel: CommunicationChannel,
): ConsentScopeDefinition | undefined {
    return CONSENT_SCOPES.find(
        (s) => s.purpose === purpose && s.channel === channel,
    );
}

/** Legacy boolean column mirroring DIRECT_MARKETING consent per channel. */
export const LEGACY_MARKETING_COLUMN: Partial<
    Record<
        CommunicationChannel,
        'smsConsent' | 'emailConsent' | 'whatsappConsent'
    >
> = {
    [C.Sms]: 'smsConsent',
    [C.Email]: 'emailConsent',
    [C.WhatsApp]: 'whatsappConsent',
};

/** Legacy per-channel operational toggle used as default preference. */
export const LEGACY_OPERATIONAL_COLUMN: Record<
    CommunicationChannel,
    'notifyPanel' | 'notifySms' | 'notifyEmail' | 'notifyWhatsapp'
> = {
    [C.Panel]: 'notifyPanel',
    [C.Sms]: 'notifySms',
    [C.Email]: 'notifyEmail',
    [C.WhatsApp]: 'notifyWhatsapp',
};

export type ActorRole = 'admin' | 'employee' | 'receptionist' | 'client';
