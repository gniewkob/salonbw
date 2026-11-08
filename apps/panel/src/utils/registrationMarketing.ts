/**
 * A single voluntary direct-marketing choice in the registration UI.
 * The existing API translates channel booleans into separately audited
 * DIRECT_MARKETING grants. Unchecked means all channels are disabled.
 *
 * Preferences are independent and can be narrowed after registration.
 * These flags do not grant consent for NEWSLETTER or REVIEW_REQUEST purposes.
 */
export function registrationMarketingChannels(agreed: boolean): {
    emailConsent: boolean;
    smsConsent: boolean;
    whatsappConsent: boolean;
} {
    return {
        emailConsent: agreed,
        smsConsent: agreed,
        whatsappConsent: agreed,
    };
}
