import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { Customer } from '@/types';
import V18CustomerCommunicationOverview from '@/components/v18/V18CustomerCommunicationOverview';
import * as communicationHooks from '@/hooks/useCommunicationConsents';
import * as smsHooks from '@/hooks/useSms';
import * as emailHooks from '@/hooks/useEmails';

jest.mock('@/hooks/useCommunicationConsents');
jest.mock('@/hooks/useSms');
jest.mock('@/hooks/useEmails');
jest.mock('@/components/communication/CustomerConsentHistory', () => ({
    __esModule: true,
    default: () => <div data-testid="v18-consent-audit">Audyt zgód</div>,
}));

const communication = jest.mocked(communicationHooks);
const sms = jest.mocked(smsHooks);
const email = jest.mocked(emailHooks);

const customer = {
    id: 40,
    name: 'Klient testowy',
    email: 'klient@example.invalid',
    phone: null,
    termsConsent: true,
    gdprConsent: false,
} as Customer;

beforeEach(() => {
    communication.useCommunicationState.mockReturnValue({
        isLoading: false,
        isError: false,
        data: {
            customerId: 40,
            receiveNotifications: true,
            contact: { hasPhone: false, hasEmail: true },
            consents: [
                {
                    purpose: 'DIRECT_MARKETING',
                    channel: 'EMAIL',
                    status: 'GRANTED',
                },
                {
                    purpose: 'DIRECT_MARKETING',
                    channel: 'SMS',
                    status: 'UNKNOWN',
                    legacyUnverifiedConsent: true,
                },
            ],
            preferences: [
                {
                    communicationClass: 'OPERATIONAL',
                    channel: 'EMAIL',
                    effectiveAllowed: true,
                },
                {
                    communicationClass: 'OPERATIONAL',
                    channel: 'SMS',
                    effectiveAllowed: false,
                },
            ],
        },
    } as never);
    sms.useSmsHistory.mockReturnValue({
        loading: false,
        error: null,
        data: { items: [], total: 0 },
    } as never);
    email.useEmailHistory.mockReturnValue({
        loading: false,
        error: null,
        data: { items: [], total: 0 },
    } as never);
});

describe('V18 communication overview', () => {
    it('shows short statuses without mounting histories or mutating consent state', () => {
        const edit = jest.fn();
        render(
            <V18CustomerCommunicationOverview
                customer={customer}
                onEditConsents={edit}
            />,
        );

        expect(
            screen.getByTestId('v18-communication-overview'),
        ).toBeInTheDocument();
        expect(screen.getByText('Ustawienia w skrócie')).toBeInTheDocument();
        expect(screen.getByText('Regulamin zaakceptowany')).toBeInTheDocument();
        expect(screen.getByText('1 z 3 kanałów ze zgodą')).toBeInTheDocument();
        expect(screen.queryByText('Marketing — SMS')).toBeNull();
        expect(screen.queryByTestId('v18-consent-audit')).toBeNull();
        expect(sms.useSmsHistory).toHaveBeenLastCalledWith(
            expect.objectContaining({ enabled: false }),
        );
        expect(email.useEmailHistory).toHaveBeenLastCalledWith(
            expect.objectContaining({ enabled: false }),
        );

        fireEvent.click(
            screen.getByRole('button', { name: 'Edytuj komunikację' }),
        );
        expect(edit).toHaveBeenCalledTimes(1);
    });

    it('reveals formal details and consent audit only on demand', async () => {
        render(
            <V18CustomerCommunicationOverview
                customer={customer}
                onEditConsents={jest.fn()}
            />,
        );

        expect(screen.queryByText(/Historyczne pole RODO/)).toBeNull();
        fireEvent.click(screen.getByText('Informacje formalne i regulamin'));
        await waitFor(() => {
            expect(
                screen.getByText(/Historyczne pole RODO/),
            ).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Historia zmian zgód i preferencji'));
        await waitFor(() => {
            expect(screen.getByTestId('v18-consent-audit')).toBeInTheDocument();
        });
    });

    it('fetches SMS history only after opening its disclosure', async () => {
        render(
            <V18CustomerCommunicationOverview
                customer={customer}
                onEditConsents={jest.fn()}
            />,
        );

        fireEvent.click(screen.getByText('Historia wysłanych wiadomości'));
        await waitFor(() =>
            expect(sms.useSmsHistory).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    recipientId: 40,
                    enabled: true,
                }),
            ),
        );
        expect(
            screen.getByText('Brak wysłanych SMS do tego klienta.'),
        ).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'E-mail' }));
        expect(email.useEmailHistory).toHaveBeenLastCalledWith(
            expect.objectContaining({ enabled: true }),
        );
    });
});
