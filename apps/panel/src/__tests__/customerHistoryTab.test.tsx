import { render, screen } from '@testing-library/react';
import CustomerHistoryTab from '@/components/customers/CustomerHistoryTab';

jest.mock('@/components/customers/CustomerTimeline', () => ({
    __esModule: true,
    default: () => <div data-testid="customer-timeline-mock">timeline</div>,
}));

jest.mock('@/hooks/useCustomers', () => ({
    useCustomerEventHistory: () => ({
        isLoading: false,
        error: null,
        data: {
            items: [],
            counts: {
                all: 0,
                upcoming: 0,
                completed: 0,
                cancelled: 0,
                no_show: 0,
            },
            total: 0,
            limit: 20,
            offset: 0,
        },
    }),
}));

jest.mock('@/hooks/useCustomerLinkedSales', () => ({
    useCustomerLinkedSales: () => ({
        linkedSalesQuery: {
            data: { items: [], total: 0 },
            isLoading: false,
            isError: false,
        },
    }),
}));

describe('CustomerHistoryTab', () => {
    it('renders timeline context and detailed sections labels', () => {
        render(<CustomerHistoryTab customerId={123} />);

        expect(screen.getByText('Timeline klienta')).toBeInTheDocument();
        expect(
            screen.getByText(/Szybki kontekst \(wizyty, sprzedaże, notatki\)/i),
        ).toBeInTheDocument();
        expect(
            screen.getByTestId('customer-timeline-mock'),
        ).toBeInTheDocument();
        expect(
            screen.getByText(/szczegóły sprzedaży klienta/i),
        ).toBeInTheDocument();
        expect(
            screen.getByText(/szczegóły historii wizyt/i),
        ).toBeInTheDocument();
    });
});
