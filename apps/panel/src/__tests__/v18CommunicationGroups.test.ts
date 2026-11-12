import type { CommunicationState } from '@/api/communicationConsents';
import {
    V18_CHANNEL_GROUPS,
    marketingGroupConsent,
    operationalGroupDelivery,
    operationalGroupAuthorization,
    operationalGroupSettings,
    setOperationalGroupDraft,
} from '@/components/v18/communicationGroups';

const [messaging, email] = V18_CHANNEL_GROUPS;

const state = {
    customerId: 40,
    receiveNotifications: true,
    contact: { hasPhone: true, hasEmail: true },
    consents: [
        { purpose: 'DIRECT_MARKETING', channel: 'SMS', status: 'GRANTED' },
        {
            purpose: 'DIRECT_MARKETING',
            channel: 'WHATSAPP',
            status: 'UNKNOWN',
            legacyUnverifiedConsent: true,
        },
        { purpose: 'DIRECT_MARKETING', channel: 'EMAIL', status: 'WITHDRAWN' },
    ],
    preferences: [
        {
            communicationType: 'APPOINTMENT_REMINDER',
            communicationClass: 'OPERATIONAL',
            channel: 'SMS',
            supported: true,
            preferred: true,
            effectiveAllowed: true,
        },
        {
            communicationType: 'APPOINTMENT_REMINDER',
            communicationClass: 'OPERATIONAL',
            channel: 'WHATSAPP',
            supported: true,
            preferred: false,
            effectiveAllowed: false,
        },
        {
            communicationType: 'APPOINTMENT_REMINDER',
            communicationClass: 'OPERATIONAL',
            channel: 'EMAIL',
            supported: true,
            preferred: false,
            effectiveAllowed: false,
        },
        {
            communicationType: 'APPOINTMENT_REMINDER',
            communicationClass: 'OPERATIONAL',
            channel: 'PANEL',
            supported: true,
            preferred: true,
            effectiveAllowed: true,
        },
        {
            communicationType: 'MASS_MARKETING',
            communicationClass: 'MARKETING',
            channel: 'WHATSAPP',
            supported: true,
            preferred: false,
            effectiveAllowed: false,
        },
    ],
} as CommunicationState;

describe('V18 two grouped contact channels', () => {
    it('does not equate SMS marketing consent with WhatsApp consent', () => {
        expect(marketingGroupConsent(state, messaging)).toEqual({
            status: 'partial',
            granted: 1,
            total: 2,
        });
        expect(marketingGroupConsent(state, email).status).toBe('off');

        const withoutSms = {
            ...state,
            consents: state.consents.map((consent) => ({
                ...consent,
                status: 'UNKNOWN' as const,
            })),
        };
        expect(marketingGroupConsent(withoutSms, messaging).status).toBe('off');
    });

    it('only stages operational preferences in the selected group', () => {
        const draft = setOperationalGroupDraft(state, messaging, {}, true);
        expect(draft).toEqual({
            'APPOINTMENT_REMINDER:SMS': true,
        });
        expect(operationalGroupSettings(state, messaging, draft).status).toBe(
            'partial',
        );
        const disabled = setOperationalGroupDraft(state, messaging, {}, false);
        expect(disabled).toEqual({
            'APPOINTMENT_REMINDER:SMS': false,
            'APPOINTMENT_REMINDER:WHATSAPP': false,
        });
        expect(operationalGroupSettings(state, email, draft).status).toBe(
            'off',
        );
        expect(draft).not.toHaveProperty('APPOINTMENT_REMINDER:PANEL');
        expect(draft).not.toHaveProperty('MASS_MARKETING:WHATSAPP');
    });

    it('reports partial operational configuration and actual eligibility', () => {
        expect(operationalGroupSettings(state, messaging).status).toBe(
            'partial',
        );
        expect(operationalGroupDelivery(state, messaging).status).toBe(
            'partial',
        );
        expect(operationalGroupDelivery(state, email).status).toBe('off');
        expect(
            operationalGroupDelivery(
                { ...state, receiveNotifications: false },
                messaging,
            ).status,
        ).toBe('off');
    });

    it('reports server-authorized sends separately from selected preferences', () => {
        const summary = operationalGroupSettings(state, messaging);
        const authorized = operationalGroupAuthorization(state, messaging);

        expect(summary.enabled).toBe(1);
        expect(summary.total).toBe(2);
        expect(authorized).toEqual({ enabled: 1, total: 2 });

        const selectedButBlocked = {
            ...state,
            preferences: state.preferences.map((pref) =>
                pref.channel === 'WHATSAPP' &&
                pref.communicationClass === 'OPERATIONAL'
                    ? { ...pref, preferred: true, effectiveAllowed: false }
                    : pref,
            ),
        };
        // "2/2 selected" is never described as "2/2 authorized".
        expect(
            operationalGroupSettings(selectedButBlocked, messaging).enabled,
        ).toBe(2);
        expect(
            operationalGroupAuthorization(selectedButBlocked, messaging),
        ).toEqual({
            enabled: 1,
            total: 2,
        });

        expect(
            operationalGroupAuthorization(
                {
                    ...selectedButBlocked,
                    contact: { hasPhone: false, hasEmail: true },
                },
                messaging,
            ).enabled,
        ).toBe(0);
        expect(
            operationalGroupAuthorization(
                { ...selectedButBlocked, receiveNotifications: false },
                messaging,
            ).enabled,
        ).toBe(0);
    });

    it('does not mark appointment channels active without contact details', () => {
        const noPhone = {
            ...state,
            contact: { hasPhone: false, hasEmail: true },
        };
        const noEmail = {
            ...state,
            contact: { hasPhone: true, hasEmail: false },
        };
        expect(operationalGroupDelivery(noPhone, messaging)).toEqual({
            status: 'unavailable',
            enabled: 0,
            total: 2,
        });
        expect(operationalGroupDelivery(noEmail, email).status).toBe(
            'unavailable',
        );
        // A recorded preference alone cannot overcome missing contact data.
        expect(operationalGroupSettings(noPhone, messaging).status).toBe(
            'partial',
        );
    });

    it('does not add unsupported channel preferences to a bulk change', () => {
        const limited = {
            ...state,
            preferences: state.preferences.map((pref) =>
                pref.channel === 'WHATSAPP'
                    ? { ...pref, supported: false }
                    : pref,
            ),
        };
        const draft = setOperationalGroupDraft(limited, messaging, {}, false);
        expect(draft).toEqual({ 'APPOINTMENT_REMINDER:SMS': false });
    });
});
