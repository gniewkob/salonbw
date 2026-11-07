/**
 * Manual Jest mock: deterministic catalogue/state so forms that embed the
 * consent components can render without QueryClient/Auth providers.
 */
const scopes = [
    {
        purpose: 'DIRECT_MARKETING',
        channel: 'SMS',
        label: 'Marketing — SMS',
        textVersion: 'direct-marketing-sms-v1-draft',
        text: 'Zgoda SMS',
        draft: true,
    },
    {
        purpose: 'DIRECT_MARKETING',
        channel: 'EMAIL',
        label: 'Marketing — e-mail',
        textVersion: 'direct-marketing-email-v1-draft',
        text: 'Zgoda e-mail',
        draft: true,
    },
];

export const mockCatalog = {
    channels: ['PANEL', 'SMS', 'EMAIL', 'WHATSAPP'],
    types: [],
    consentScopes: scopes,
    staffGrantSources: ['IN_PERSON_SIGNED_FORM'],
};

const query = <T>(data: T) => ({ isLoading: false, isError: false, data });
const mutation = () => ({ mutate: jest.fn(), isPending: false });

export const communicationKeys = {
    catalog: ['communication-catalog'],
    state: () => ['communication-state'],
    history: () => ['communication-history'],
};
export const useCommunicationCatalog = jest.fn(() => query(mockCatalog));
export const useCommunicationState = jest.fn(() => query(undefined));
export const useConsentHistory = jest.fn(() =>
    query({ items: [], total: 0, page: 1, limit: 20, legacyItems: [] }),
);
export const useGrantConsent = jest.fn(mutation);
export const useWithdrawConsent = jest.fn(mutation);
export const useUpdateCommunicationPreferences = jest.fn(mutation);
