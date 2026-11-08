import {
    CommunicationChannel as Ch,
    CommunicationType as T,
    ConsentPurpose as P,
    ConsentStatus as S,
    EligibilityReason as R,
} from './communication-consent.types';
import { LegacyCustomerFlags, evaluatePreference } from './consent-evaluation';

const flags = (
    over: Partial<LegacyCustomerFlags> = {},
): LegacyCustomerFlags => ({
    receiveNotifications: true,
    notifyPanel: true,
    notifySms: true,
    notifyEmail: true,
    notifyWhatsapp: false,
    smsConsent: false,
    emailConsent: false,
    whatsappConsent: false,
    ...over,
});

describe('evaluatePreference', () => {
    it('denies marketing without a recorded consent', () => {
        const r = evaluatePreference(flags(), [], [], T.MassMarketing, Ch.Sms);
        expect(r.effectiveAllowed).toBe(false);
        expect(r.consentStatus).toBe(S.Unknown);
        expect(r.reason).toBe(R.MarketingConsentMissing);
    });

    it('treats a legacy boolean as unverified, never as consent', () => {
        const r = evaluatePreference(
            flags({ smsConsent: true }),
            [],
            [],
            T.MassMarketing,
            Ch.Sms,
        );
        expect(r.effectiveAllowed).toBe(false);
        expect(r.legacyUnverifiedConsent).toBe(true);
        expect(r.reason).toBe(R.LegacyConsentUnverified);
    });

    it('allows marketing only on the granted channel', () => {
        const consents = [
            { purpose: P.DirectMarketing, channel: Ch.Sms, status: S.Granted },
        ];
        expect(
            evaluatePreference(flags(), consents, [], T.MassMarketing, Ch.Sms)
                .effectiveAllowed,
        ).toBe(true);
        expect(
            evaluatePreference(flags(), consents, [], T.MassMarketing, Ch.Email)
                .effectiveAllowed,
        ).toBe(false);
    });

    it('requires the verified WhatsApp marketing recipient to match the current phone', () => {
        const granted = [{
            purpose: P.ReviewRequest,
            channel: Ch.WhatsApp,
            status: S.Granted,
            contactValue: '48600100200',
        }];
        expect(evaluatePreference(
            flags({ phone: '+48 600 100 200' }),
            granted,
            [],
            T.PostVisitReview,
            Ch.WhatsApp,
        ).effectiveAllowed).toBe(true);
        expect(evaluatePreference(
            flags({ phone: '+48 600 100 201' }),
            granted,
            [],
            T.PostVisitReview,
            Ch.WhatsApp,
        ).reason).toBe(R.WhatsappContactChanged);
    });

    it('does not let one purpose authorise another', () => {
        const consents = [
            { purpose: P.DirectMarketing, channel: Ch.Sms, status: S.Granted },
        ];
        const r = evaluatePreference(
            flags(),
            consents,
            [],
            T.PostVisitReview,
            Ch.Sms,
        );
        expect(r.effectiveAllowed).toBe(false);
        expect(r.reason).toBe(R.MarketingConsentMissing);
    });

    it('blocks after withdrawal', () => {
        const r = evaluatePreference(
            flags({ smsConsent: true }),
            [
                {
                    purpose: P.DirectMarketing,
                    channel: Ch.Sms,
                    status: S.Withdrawn,
                },
            ],
            [],
            T.BirthdayWishes,
            Ch.Sms,
        );
        expect(r.effectiveAllowed).toBe(false);
        expect(r.reason).toBe(R.MarketingConsentWithdrawn);
    });

    it('respects a marketing preference opt-out even with consent', () => {
        const r = evaluatePreference(
            flags(),
            [
                {
                    purpose: P.DirectMarketing,
                    channel: Ch.Sms,
                    status: S.Granted,
                },
            ],
            [
                {
                    communicationType: T.BirthdayWishes,
                    channel: Ch.Sms,
                    enabled: false,
                },
            ],
            T.BirthdayWishes,
            Ch.Sms,
        );
        expect(r.reason).toBe(R.PreferenceDisabled);
    });

    it('allows operational messages without marketing consent', () => {
        const r = evaluatePreference(
            flags(),
            [],
            [],
            T.AppointmentReminder,
            Ch.Sms,
        );
        expect(r.effectiveAllowed).toBe(true);
        expect(r.consentStatus).toBe(S.NotApplicable);
    });

    it('denies WhatsApp appointment messages without a separate recipient opt-in', () => {
        const r = evaluatePreference(
            flags({ phone: '48123456789', notifyWhatsapp: true, whatsappConsent: true }),
            [{ purpose: P.DirectMarketing, channel: Ch.WhatsApp, status: S.Granted }],
            [],
            T.BookingConfirmation,
            Ch.WhatsApp,
        );
        expect(r.effectiveAllowed).toBe(false);
        expect(r.reason).toBe(R.WhatsappOptInMissing);
    });

    it('authorizes WhatsApp appointment messages only for an evidenced matching phone', () => {
        const grant = [{
            purpose: P.WhatsappAppointmentUpdates,
            channel: Ch.WhatsApp,
            status: S.Granted,
            contactValue: '48123456789',
        }];
        const allowed = evaluatePreference(
            flags({ phone: '+48 123 456 789', notifyWhatsapp: true }),
            grant, [],
            T.BookingConfirmation, Ch.WhatsApp,
        );
        const changed = evaluatePreference(
            flags({ phone: '48987654321', notifyWhatsapp: true }),
            grant, [],
            T.BookingConfirmation, Ch.WhatsApp,
        );
        expect(allowed.effectiveAllowed).toBe(true);
        expect(changed.reason).toBe(R.WhatsappContactChanged);
    });

    it('immediately denies service WhatsApp after recipient opt-out', () => {
        const r = evaluatePreference(
            flags({ phone: '48123456789', notifyWhatsapp: true }),
            [{
                purpose: P.WhatsappAppointmentUpdates,
                channel: Ch.WhatsApp,
                status: S.Withdrawn,
                contactValue: null,
            }],
            [],
            T.AppointmentChange,
            Ch.WhatsApp,
        );
        expect(r.reason).toBe(R.WhatsappOptInWithdrawn);
    });

    it('does not confuse a service WhatsApp grant with a marketing grant', () => {
        const r = evaluatePreference(
            flags({ phone: '48123456789', notifyWhatsapp: true }),
            [{
                purpose: P.WhatsappAppointmentUpdates,
                channel: Ch.WhatsApp,
                status: S.Granted,
                contactValue: '48123456789',
            }],
            [], T.PostVisitReview, Ch.WhatsApp,
        );
        expect(r.reason).toBe(R.MarketingConsentMissing);
    });

    it('uses an explicit per-type preference over the legacy channel flag', () => {
        const prefs = [
            {
                communicationType: T.AppointmentReminder,
                channel: Ch.Sms,
                enabled: false,
            },
        ];
        expect(
            evaluatePreference(
                flags(),
                [],
                prefs,
                T.AppointmentReminder,
                Ch.Sms,
            ).reason,
        ).toBe(R.PreferenceDisabled);
        // Other operational types on the same channel are unaffected.
        expect(
            evaluatePreference(flags(), [], prefs, T.AppointmentChange, Ch.Sms)
                .effectiveAllowed,
        ).toBe(true);
    });

    it('honours the master notification switch for operational types', () => {
        const r = evaluatePreference(
            flags({ receiveNotifications: false }),
            [],
            [],
            T.BookingConfirmation,
            Ch.Email,
        );
        expect(r.reason).toBe(R.NotificationsDisabled);
    });

    it('rejects unsupported type/channel combinations', () => {
        const r = evaluatePreference(
            flags(),
            [{ purpose: P.Newsletter, channel: Ch.Email, status: S.Granted }],
            [],
            T.Newsletter,
            Ch.Email,
        );
        expect(r.supported).toBe(false);
        expect(r.effectiveAllowed).toBe(false);
        expect(r.reason).toBe(R.ChannelNotSupported);
    });
});
