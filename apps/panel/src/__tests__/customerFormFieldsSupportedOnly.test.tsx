import { render, screen } from '@testing-library/react';
import CustomerFormFields, {
    type CustomerFormDraft,
} from '@/components/customers/CustomerFormFields';

const draft: CustomerFormDraft = {
    firstName: 'Anna',
    lastName: 'Testowa',
    email: 'a@example.invalid',
    phone: '123456789',
    birthDate: '',
    gender: 'female',
    address: 'Testowa',
    buildingNo: '',
    apartmentNo: '',
    city: 'Testowo',
    postalCode: '00-000',
    country: '',
    nameDay: '',
    origin: '',
    pesel: '',
    nip: '',
    cardNumber: '',
    groups: '',
    description: 'Uwagi',
    gdprConsent: true,
    termsConsent: true,
    notifyPanel: true,
    communication: { grants: [] },
    discountPercent: '10',
};

jest.mock('@/hooks/useCommunicationConsents');
describe('CustomerFormFields supportedOnly boundary', () => {
    it('renders only persisted fields with clean V18 labels', () => {
        render(
            <CustomerFormFields
                values={draft}
                onChange={jest.fn()}
                fieldIdPrefix="v18-test"
                supportedOnly
            />,
        );
        expect(screen.getByLabelText('Imię')).toHaveValue('Anna');
        expect(screen.getByLabelText('Kod pocztowy')).toHaveValue('00-000');
        expect(screen.getByLabelText('Stały rabat (%)')).toHaveValue(10);
        expect(screen.queryByLabelText('Nr domu')).not.toBeInTheDocument();
        expect(screen.queryByLabelText('PESEL')).not.toBeInTheDocument();
        expect(screen.queryByLabelText('Grupy')).not.toBeInTheDocument();
    });

    it('shows the privacy notice, not a broad GDPR checkbox, in V18', () => {
        const onChange = jest.fn();
        render(
            <CustomerFormFields
                values={draft}
                onChange={onChange}
                fieldIdPrefix="v18-privacy-test"
                supportedOnly
                mode="edit"
            />,
        );
        expect(screen.getByText('Informacje formalne')).toBeInTheDocument();
        expect(
            screen.queryByLabelText('Wyrażam zgodę na przetwarzanie danych osobowych'),
        ).not.toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Polityce prywatności' })).toHaveAttribute(
            'href',
            expect.stringContaining('/privacy'),
        );
        expect(screen.getByLabelText('Akceptacja regulaminu salonu')).toBeChecked();
        expect(onChange).not.toHaveBeenCalled();
    });

    it('keeps the original legacy fields and numbered labels by default', () => {
        render(
            <CustomerFormFields
                values={draft}
                onChange={jest.fn()}
                fieldIdPrefix="legacy-test"
            />,
        );
        expect(screen.getByLabelText('1. Imię')).toHaveValue('Anna');
        expect(screen.getByLabelText('9. Nr domu')).toBeInTheDocument();
        expect(screen.getByLabelText('17. PESEL')).toBeInTheDocument();
        expect(screen.getByLabelText('15. Grupy')).toBeInTheDocument();
        expect(screen.getByLabelText('Wyrażam zgodę na przetwarzanie danych osobowych')).toBeChecked();
    });
});
