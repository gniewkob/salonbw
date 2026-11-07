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
    it('shows only status and history access on the V18 customer profile', () => {
        render(
            <CustomerCommunicationPreferences
                scope={{ kind: 'customer', customerId: 20 }}
                audience="staff"
                readOnly
                variant="v18"
            />,
        );
        expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Wycofaj' })).toBeNull();
        expect(screen.queryByRole('button', { name: 'Zarejestruj zgodę' })).toBeNull();
        expect(screen.queryByRole('button', { name: 'Zapisz zmiany' })).toBeNull();
        expect(screen.getByText(/stara zgoda bez dowodu/)).toBeInTheDocument();
        expect(screen.getByLabelText('Przypomnienie o wizycie — SMS: włączone'))
            .toBeInTheDocument();
    });

    it('stages V18 preference changes and only commits after explicit save confirmation', () => {
        render(
            <CustomerCommunicationPreferences
                scope={{ kind: 'customer', customerId: 20 }}
                audience="staff"
                variant="v18"
            />,
        );
        const control = screen.getByRole('checkbox', { name: 'Przypomnienie o wizycie — SMS' });
        expect(control).toBeChecked();
        const save = screen.getByRole('button', { name: 'Zapisz zmiany' });
        expect(save).toBeDisabled();
        fireEvent.click(control);
        expect(control).not.toBeChecked();
        expect(prefs).not.toHaveBeenCalled();
        expect(save).toBeEnabled();
        fireEvent.click(save);
        expect(prefs).not.toHaveBeenCalled();
        fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Zapisz zmiany' }));
        expect(prefs).toHaveBeenCalledWith(
            expect.objectContaining({
                changes: [{ communicationType: 'APPOINTMENT_REMINDER', channel: 'SMS', enabled: false }],
                idempotencyKey: expect.any(String),
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
