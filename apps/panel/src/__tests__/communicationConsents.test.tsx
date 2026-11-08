import { fireEvent, render, screen, within } from '@testing-library/react';
import CustomerCommunicationPreferences from '@/components/communication/CustomerCommunicationPreferences';
import InitialConsentFields, {
    toCommunicationPayload,
} from '@/components/communication/InitialConsentFields';
import * as hooks from '@/hooks/useCommunicationConsents';
import type { CommunicationState } from '@/api/communicationConsents';

jest.mock('@/hooks/useCommunicationConsents');

const mocked = jest.mocked(hooks);

const state = (over: Partial<CommunicationState> = {}): CommunicationState => ({
    customerId: 20,
    receiveNotifications: true,
    contact: { hasPhone: true, hasEmail: true },
    consents: [
        {
            purpose: 'DIRECT_MARKETING',
            channel: 'SMS',
            label: 'Marketing — SMS',
            status: 'GRANTED',
            legacyUnverifiedConsent: false,
            currentTextVersion: 'direct-marketing-sms-v1-draft',
            recordedAt: '2026-11-07T10:00:00Z',
            effectiveAt: '2026-11-07T10:00:00Z',
            source: 'IN_PERSON_SIGNED_FORM',
            consentTextVersion: 'direct-marketing-sms-v1-draft',
            evidenceReference: 'F-1',
            actorRole: 'receptionist',
        },
        {
            purpose: 'DIRECT_MARKETING',
            channel: 'EMAIL',
            label: 'Marketing — e-mail',
            status: 'UNKNOWN',
            legacyUnverifiedConsent: true,
            currentTextVersion: 'direct-marketing-email-v1-draft',
            recordedAt: null,
            effectiveAt: null,
            source: null,
            consentTextVersion: null,
            evidenceReference: null,
            actorRole: null,
        },
    ],
    preferences: [
        {
            communicationType: 'APPOINTMENT_REMINDER',
            channel: 'SMS',
            communicationClass: 'OPERATIONAL',
            supported: true,
            preferred: true,
            preferenceSource: 'LEGACY_DEFAULT',
            consentStatus: 'NOT_APPLICABLE',
            legacyUnverifiedConsent: false,
            effectiveAllowed: true,
            reason: 'OPERATIONAL_ALLOWED',
        },
    ],
    updatedAt: '2026-11-07T10:00:00Z',
    ...over,
});

const catalog = {
    channels: ['SMS'],
    types: [
        {
            type: 'APPOINTMENT_REMINDER',
            class: 'OPERATIONAL',
            purpose: null,
            label: 'Przypomnienie o wizycie',
            supportedChannels: ['SMS'],
        },
    ],
    consentScopes: [
        {
            purpose: 'DIRECT_MARKETING',
            channel: 'EMAIL',
            label: 'Marketing — e-mail',
            textVersion: 'direct-marketing-email-v1-draft',
            text: 'Treść zgody e-mail',
            draft: true,
        },
        {
            purpose: 'DIRECT_MARKETING',
            channel: 'SMS',
            label: 'Marketing — SMS',
            textVersion: 'direct-marketing-sms-v1-draft',
            text: 'Treść zgody SMS',
            draft: true,
        },
    ],
    staffGrantSources: ['IN_PERSON_SIGNED_FORM', 'EMAIL_CONFIRMATION'],
};

let grant: jest.Mock;
let withdraw: jest.Mock;
let prefs: jest.Mock;

beforeEach(() => {
    grant = jest.fn();
    withdraw = jest.fn();
    prefs = jest.fn();
    mocked.useCommunicationCatalog.mockReturnValue({
        isLoading: false,
        isError: false,
        data: catalog,
    } as never);
    mocked.useCommunicationState.mockReturnValue({
        isLoading: false,
        isError: false,
        data: state(),
    } as never);
    mocked.useGrantConsent.mockReturnValue({
        mutate: grant,
        isPending: false,
    } as never);
    mocked.useWithdrawConsent.mockReturnValue({
        mutate: withdraw,
        isPending: false,
    } as never);
    mocked.useUpdateCommunicationPreferences.mockReturnValue({
        mutate: prefs,
        isPending: false,
    } as never);
});

describe('CustomerCommunicationPreferences', () => {
    const expandV18 = (section: 'operational' | 'marketing') => {
        const sectionId =
            section === 'operational'
                ? 'v18-operational-settings'
                : 'v18-marketing-settings';
        const title =
            section === 'operational'
                ? 'Powiadomienia o wizytach'
                : 'Marketing i zgody';
        const details = screen.getByTestId(sectionId) as HTMLDetailsElement;
        fireEvent.click(within(details).getByText(title));
        expect(details.open).toBe(true);
    };
    const expandAdvancedOperational = () => {
        fireEvent.click(
            within(screen.getByTestId('v18-operational-settings')).getByText(
                'Ustawienia poszczególnych wiadomości',
            ),
        );
    };
    const expandMarketingChannel = (channel: 'MESSAGING' | 'EMAIL') => {
        const group = screen
            .getByTestId('v18-marketing-settings')
            .querySelector(`[data-consent-group="${channel}"]`);
        if (!group) throw new Error(`Missing consent group ${channel}`);
        fireEvent.click(
            within(group as HTMLElement).getByText('Zobacz zgody'),
        );
    };
    it('separates operational notifications from marketing consent and settings in V18', () => {
        mocked.useCommunicationCatalog.mockReturnValue({
            isLoading: false,
            isError: false,
            data: {
                ...catalog,
                types: [
                    ...catalog.types,
                    {
                        type: 'MASS_MARKETING',
                        class: 'MARKETING',
                        purpose: 'DIRECT_MARKETING',
                        label: 'Promocje salonu',
                        supportedChannels: ['SMS'],
                    },
                ],
            },
        } as never);
        mocked.useCommunicationState.mockReturnValue({
            isLoading: false,
            isError: false,
            data: state({
                preferences: [
                    ...state().preferences,
                    {
                        ...state().preferences[0],
                        communicationType: 'MASS_MARKETING',
                        communicationClass: 'MARKETING',
                        preferred: false,
                        effectiveAllowed: false,
                    },
                ],
            }),
        } as never);
        render(
            <CustomerCommunicationPreferences
                scope={{ kind: 'customer', customerId: 20 }}
                audience="staff"
                variant="v18"
            />,
        );
        expandV18('operational');
        expandAdvancedOperational();
        expandV18('marketing');
        expandMarketingChannel('MESSAGING');
        expandMarketingChannel('EMAIL');

        const notifications = screen.getByTestId('v18-operational-settings');
        const marketing = screen.getByTestId('v18-marketing-settings');
        expect(
            within(marketing).getByText('Zgoda częściowa'),
        ).toBeInTheDocument();
        expect(
            within(notifications).getByText('Kanały powiadomień'),
        ).toBeInTheDocument();
        expect(
            within(notifications).queryByText('Marketing — SMS'),
        ).not.toBeInTheDocument();
        expect(
            within(marketing).getByText('Marketing — SMS'),
        ).toBeInTheDocument();
        expect(
            within(marketing).getByText('Dodatkowe preferencje marketingowe'),
        ).toBeInTheDocument();
        expect(
            within(marketing).getByText('Dodatkowe ustawienia marketingowe'),
        ).toBeInTheDocument();
        expect(
            screen.getByText(/Zgody i preferencje są niezależne/),
        ).toBeInTheDocument();
    });

    it('shows only status and history access on the V18 customer profile', () => {
        render(
            <CustomerCommunicationPreferences
                scope={{ kind: 'customer', customerId: 20 }}
                audience="staff"
                readOnly
                variant="v18"
            />,
        );
        expandV18('operational');
        expandAdvancedOperational();
        expandV18('marketing');
        expandMarketingChannel('MESSAGING');
        expandMarketingChannel('EMAIL');
        expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Wycofaj' })).toBeNull();
        expect(
            screen.queryByRole('button', { name: 'Zarejestruj zgodę' }),
        ).toBeNull();
        expect(
            screen.queryByRole('button', { name: 'Zapisz zmiany' }),
        ).toBeNull();
        expect(screen.getByText(/stara zgoda bez dowodu/)).toBeInTheDocument();
        expect(
            screen.getByLabelText('Przypomnienie o wizycie — SMS: włączone'),
        ).toBeInTheDocument();
    });

    it('shows compact supported channels and reports unsaved changes to the editor', () => {
        const onDirtyChange = jest.fn();
        render(
            <CustomerCommunicationPreferences
                scope={{ kind: 'customer', customerId: 20 }}
                audience="staff"
                variant="v18"
                onDirtyChange={onDirtyChange}
            />,
        );
        expandV18('operational');
        expandAdvancedOperational();

        const notifications = screen.getByTestId('v18-operational-settings');
        expect(
            within(notifications).queryByRole('table'),
        ).not.toBeInTheDocument();
        const toggle = within(notifications).getByRole('checkbox', {
            name: 'Przypomnienie o wizycie — SMS',
        });

        expect(onDirtyChange).toHaveBeenLastCalledWith(false);
        fireEvent.click(toggle);
        expect(onDirtyChange).toHaveBeenLastCalledWith(true);
        expect(screen.getByText('Niezapisana zmiana')).toBeInTheDocument();
        expect(prefs).not.toHaveBeenCalled();

        fireEvent.click(toggle);
        expect(onDirtyChange).toHaveBeenLastCalledWith(false);
        expect(screen.queryByText('Niezapisana zmiana')).toBeNull();
        expect(
            screen.queryByRole('button', { name: 'Zapisz zmiany' }),
        ).toBeNull();
    });

    it('stages V18 preference changes and only commits after explicit save confirmation', () => {
        render(
            <CustomerCommunicationPreferences
                scope={{ kind: 'customer', customerId: 20 }}
                audience="staff"
                variant="v18"
            />,
        );
        expandV18('operational');
        expandAdvancedOperational();
        const control = screen.getByRole('checkbox', {
            name: 'Przypomnienie o wizycie — SMS',
        });
        expect(control).toBeChecked();
        expect(
            screen.queryByRole('button', { name: 'Zapisz zmiany' }),
        ).toBeNull();
        fireEvent.click(control);
        const save = screen.getByRole('button', { name: 'Zapisz zmiany' });
        expect(control).not.toBeChecked();
        expect(prefs).not.toHaveBeenCalled();
        expect(save).toBeEnabled();
        fireEvent.click(save);
        expect(prefs).not.toHaveBeenCalled();
        fireEvent.click(
            within(screen.getByRole('dialog')).getByRole('button', {
                name: 'Zapisz zmiany',
            }),
        );
        expect(prefs).toHaveBeenCalledWith(
            expect.objectContaining({
                changes: [
                    {
                        communicationType: 'APPOINTMENT_REMINDER',
                        channel: 'SMS',
                        enabled: false,
                    },
                ],
                idempotencyKey: expect.any(String),
            }),
            expect.anything(),
        );
    });

    it('marks pending changes without implying the message was sent', () => {
        const onDirtyChange = jest.fn();
        render(
            <CustomerCommunicationPreferences
                scope={{ kind: 'customer', customerId: 20 }}
                audience="staff"
                variant="v18"
                onDirtyChange={onDirtyChange}
            />,
        );
        expandV18('operational');
        expandAdvancedOperational();

        const preference = screen.getByRole('checkbox', {
            name: 'Przypomnienie o wizycie — SMS',
        });
        expect(onDirtyChange).toHaveBeenLastCalledWith(false);
        expect(screen.getByText('Można wysłać')).toBeInTheDocument();

        fireEvent.click(preference);
        expect(onDirtyChange).toHaveBeenLastCalledWith(true);
        expect(screen.getByText('Niezapisana zmiana')).toBeInTheDocument();
        expect(
            screen.getByText('Ocena wysyłki po zapisaniu zmian'),
        ).toBeInTheDocument();
        expect(prefs).not.toHaveBeenCalled();

        fireEvent.click(preference);
        expect(onDirtyChange).toHaveBeenLastCalledWith(false);
        expect(
            screen.queryByText('Niezapisana zmiana'),
        ).not.toBeInTheDocument();
    });

    it('stages SMS + WhatsApp as one operational group without changing marketing or email', () => {
        mocked.useCommunicationState.mockReturnValue({
            isLoading: false,
            isError: false,
            data: state({
                preferences: [
                    {
                        ...state().preferences[0],
                        preferred: false,
                        effectiveAllowed: false,
                    },
                    {
                        ...state().preferences[0],
                        channel: 'WHATSAPP',
                        preferred: false,
                        effectiveAllowed: false,
                    },
                    {
                        ...state().preferences[0],
                        channel: 'EMAIL',
                        preferred: true,
                        effectiveAllowed: true,
                    },
                    {
                        ...state().preferences[0],
                        channel: 'WHATSAPP',
                        communicationClass: 'MARKETING',
                        communicationType: 'MASS_MARKETING',
                        preferred: false,
                        effectiveAllowed: false,
                    },
                ],
            }),
        } as never);
        render(
            <CustomerCommunicationPreferences
                scope={{ kind: 'customer', customerId: 20 }}
                audience="staff"
                variant="v18"
            />,
        );
        expandV18('operational');

        expect(
            screen.getByRole('button', {
                name: 'Włącz powiadomienia SMS (WhatsApp bez zmian)',
            }),
        ).toBeInTheDocument();
        fireEvent.click(
            screen.getByRole('button', {
                name: 'Włącz powiadomienia SMS (WhatsApp bez zmian)',
            }),
        );
        expect(prefs).not.toHaveBeenCalled();
        fireEvent.click(screen.getByRole('button', { name: 'Zapisz zmiany' }));
        fireEvent.click(
            within(screen.getByRole('dialog')).getByRole('button', {
                name: 'Zapisz zmiany',
            }),
        );
        expect(prefs).toHaveBeenCalledWith(
            expect.objectContaining({
                changes: [
                    {
                        communicationType: 'APPOINTMENT_REMINDER',
                        channel: 'SMS',
                        enabled: true,
                    },
                ],
            }),
            expect.anything(),
        );
    });

    it('flags legacy booleans as unverified instead of showing consent', () => {
        render(
            <CustomerCommunicationPreferences
                scope={{ kind: 'customer', customerId: 20 }}
                audience="staff"
            />,
        );
        expect(screen.getByText(/stara zgoda bez dowodu/)).toBeInTheDocument();
    });

    it('keeps real evidence mandatory inside the styled V18 customer editor', () => {
        render(
            <CustomerCommunicationPreferences
                scope={{ kind: 'customer', customerId: 20 }}
                audience="staff"
                variant="v18"
            />,
        );
        expandV18('marketing');
        expandMarketingChannel('EMAIL');
        fireEvent.click(
            screen.getByRole('button', { name: 'Zarejestruj zgodę' }),
        );
        const dialog = screen.getByRole('dialog');
        expect(
            within(dialog).getByRole('button', { name: 'Zapisz zgodę' }),
        ).toBeDisabled();
        expect(within(dialog).getByLabelText('Źródło')).toBeRequired();
        expect(
            within(dialog).getByLabelText(/Odniesienie do dowodu/),
        ).toBeRequired();
        expect(grant).not.toHaveBeenCalled();
    });

    it('requires confirmation before withdrawing', () => {
        render(
            <CustomerCommunicationPreferences
                scope={{ kind: 'customer', customerId: 20 }}
                audience="staff"
            />,
        );
        fireEvent.click(screen.getByRole('button', { name: 'Wycofaj' }));
        expect(withdraw).not.toHaveBeenCalled();
        const dialog = screen.getByRole('dialog');
        fireEvent.click(
            within(dialog).getByRole('button', { name: 'Wycofaj zgodę' }),
        );
        expect(withdraw).toHaveBeenCalledWith(
            expect.objectContaining({
                purpose: 'DIRECT_MARKETING',
                channel: 'SMS',
                idempotencyKey: expect.any(String),
            }),
            expect.anything(),
        );
    });

    it('blocks a staff grant until source and evidence are provided', () => {
        render(
            <CustomerCommunicationPreferences
                scope={{ kind: 'customer', customerId: 20 }}
                audience="staff"
            />,
        );
        fireEvent.click(
            screen.getByRole('button', { name: 'Zarejestruj zgodę' }),
        );
        const dialog = screen.getByRole('dialog');
        expect(
            within(dialog).getByText('Treść zgody e-mail'),
        ).toBeInTheDocument();
        const submit = within(dialog).getByRole('button', {
            name: 'Zapisz zgodę',
        });
        expect(submit).toBeDisabled();
        fireEvent.change(within(dialog).getByLabelText('Źródło'), {
            target: { value: 'IN_PERSON_SIGNED_FORM' },
        });
        fireEvent.change(
            within(dialog).getByLabelText(/Odniesienie do dowodu/),
            { target: { value: 'Formularz 12' } },
        );
        expect(submit).toBeEnabled();
        fireEvent.click(submit);
        expect(grant).toHaveBeenCalledWith(
            expect.objectContaining({
                purpose: 'DIRECT_MARKETING',
                channel: 'EMAIL',
                consentTextVersion: 'direct-marketing-email-v1-draft',
                source: 'IN_PERSON_SIGNED_FORM',
                evidenceReference: 'Formularz 12',
            }),
            expect.anything(),
        );
    });

    it('lets the customer grant without staff evidence fields', () => {
        render(
            <CustomerCommunicationPreferences
                scope={{ kind: 'self' }}
                audience="customer"
            />,
        );
        fireEvent.click(screen.getByRole('button', { name: 'Wyrażam zgodę' }));
        const dialog = screen.getByRole('dialog');
        expect(within(dialog).queryByLabelText('Źródło')).toBeNull();
        fireEvent.click(
            within(dialog).getByRole('button', { name: 'Zapisz zgodę' }),
        );
        expect(grant).toHaveBeenCalled();
    });

    it('changes a preference only after confirmation and keeps API state', () => {
        render(
            <CustomerCommunicationPreferences
                scope={{ kind: 'self' }}
                audience="customer"
            />,
        );
        const box = screen.getByLabelText('Przypomnienie o wizycie — SMS');
        fireEvent.click(box);
        expect(prefs).not.toHaveBeenCalled();
        // UI still reflects server state until the change is confirmed.
        expect(box).toBeChecked();
        fireEvent.click(
            within(screen.getByRole('dialog')).getByRole('button', {
                name: 'Anuluj',
            }),
        );
        expect(prefs).not.toHaveBeenCalled();
        expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('shows an error instead of fake data when the API fails', () => {
        mocked.useCommunicationState.mockReturnValue({
            isLoading: false,
            isError: true,
            data: undefined,
        } as never);
        render(
            <CustomerCommunicationPreferences
                scope={{ kind: 'self' }}
                audience="customer"
            />,
        );
        expect(screen.getByRole('alert')).toHaveTextContent(
            'Nie udało się pobrać',
        );
    });
});

describe('InitialConsentFields (customer creation)', () => {
    it('starts with every marketing consent unticked and asks for evidence once ticked', () => {
        const onChange = jest.fn();
        const { rerender } = render(
            <InitialConsentFields
                idPrefix="t"
                value={{ grants: [] }}
                onChange={onChange}
            />,
        );
        const sms = screen.getByLabelText('Marketing — SMS');
        expect(sms).not.toBeChecked();
        expect(screen.getByLabelText('Marketing — e-mail')).not.toBeChecked();
        expect(screen.queryByLabelText('Źródło zgody')).toBeNull();

        fireEvent.click(sms);
        const next = onChange.mock.calls[0][0];
        expect(next.grants).toEqual([
            {
                purpose: 'DIRECT_MARKETING',
                channel: 'SMS',
                consentTextVersion: 'direct-marketing-sms-v1-draft',
            },
        ]);
        rerender(
            <InitialConsentFields
                idPrefix="t"
                value={next}
                onChange={onChange}
            />,
        );
        expect(screen.getByLabelText('Źródło zgody')).toBeRequired();
        expect(screen.getByLabelText('Odniesienie do dowodu')).toBeRequired();
    });

    it('omits the payload when nothing was chosen', () => {
        expect(toCommunicationPayload({ grants: [] })).toBeUndefined();
        expect(toCommunicationPayload(undefined)).toBeUndefined();
    });
});
