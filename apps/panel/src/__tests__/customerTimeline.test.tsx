import { render, screen } from '@testing-library/react';
import CustomerTimeline from '@/components/customers/CustomerTimeline';

const useCustomerEventHistoryMock = jest.fn();
const useCustomerNotesMock = jest.fn();
const useCustomerLinkedSalesMock = jest.fn();

jest.mock('@/hooks/useCustomers', () => ({
    useCustomerEventHistory: (...args: unknown[]) =>
        useCustomerEventHistoryMock(...args),
    useCustomerNotes: (...args: unknown[]) => useCustomerNotesMock(...args),
}));

jest.mock('@/hooks/useCustomerLinkedSales', () => ({
    useCustomerLinkedSales: (...args: unknown[]) =>
        useCustomerLinkedSalesMock(...args),
}));

describe('CustomerTimeline', () => {
    beforeEach(() => {
        useCustomerEventHistoryMock.mockReset();
        useCustomerNotesMock.mockReset();
        useCustomerLinkedSalesMock.mockReset();

        useCustomerEventHistoryMock.mockReturnValue({
            isLoading: false,
            isError: false,
            data: {
                items: [
                    {
                        id: 101,
                        date: '2026-05-01',
                        time: '09:00',
                        service: { id: 1, name: 'Strzyżenie' },
                        employee: { id: 2, name: 'Anna' },
                        status: 'completed',
                        price: 120,
                    },
                ],
            },
        });
        useCustomerNotesMock.mockReturnValue({
            isLoading: false,
            isError: false,
            data: [
                {
                    id: 201,
                    content: 'Alergia na lateks',
                    type: 'medical',
                    isPinned: true,
                    createdAt: '2026-05-03T10:00:00.000Z',
                },
            ],
        });
        useCustomerLinkedSalesMock.mockReturnValue({
            linkedSalesQuery: {
                isLoading: false,
                isError: false,
                data: {
                    items: [
                        {
                            id: 301,
                            saleNumber: 'S-301',
                            soldAt: '2026-05-02T10:00:00.000Z',
                            totalGross: 199.99,
                        },
                    ],
                },
            },
        });
    });

    it('renders mixed timeline items sorted by descending date', () => {
        render(<CustomerTimeline customerId={1} limit={10} />);

        const labels = screen.getAllByText(/Notatka|Sprzedaż|Wizyta/);
        expect(labels[0]).toHaveTextContent('Notatka');
        expect(labels[1]).toHaveTextContent('Sprzedaż');
        expect(labels[2]).toHaveTextContent('Wizyta');

        expect(screen.getByRole('link', { name: 'S-301' })).toHaveAttribute(
            'href',
            '/sales/history/301',
        );
    });
});

