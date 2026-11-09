import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { Customer } from '@/types';
import CustomerPersonalDataTab from '@/components/customers/CustomerPersonalDataTab';

jest.mock('@/hooks/useCommunicationConsents');

const customer = {
    id: 20,
    firstName: 'Anna',
    lastName: 'Testowa',
    name: 'Anna Testowa',
    phone: '48123456789',
    email: 'anna@example.invalid',
    gdprConsent: true,
    termsConsent: true,
    notifyPanel: true,
} as Customer;

describe('V18 customer personal editor — historical GDPR field', () => {
    it('does not expose or rewrite the legacy flag when editing other details', async () => {
        const onUpdate = jest.fn().mockResolvedValue(undefined);
        render(
            <CustomerPersonalDataTab
                customer={customer}
                onUpdate={onUpdate}
                supportedOnly
            />,
        );

        expect(
            screen.queryByLabelText(
                'Wyrażam zgodę na przetwarzanie danych osobowych',
            ),
        ).not.toBeInTheDocument();
        fireEvent.change(screen.getByLabelText('Imię'), {
            target: { value: 'Alicja' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'zapisz zmiany' }));

        await waitFor(() => expect(onUpdate).toHaveBeenCalledTimes(1));
        const payload = onUpdate.mock.calls[0][0] as Partial<Customer>;
        expect(payload.firstName).toBe('Alicja');
        expect(payload).not.toHaveProperty('gdprConsent');
        expect(payload.termsConsent).toBe(true);
    });
});
