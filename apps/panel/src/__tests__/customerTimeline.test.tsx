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
        expect(screen.getByText('Zakończona')).toBeInTheDocument();
    });

    it('uses stable tie-breakers when items have same timestamp', () => {
        useCustomerEventHistoryMock.mockReturnValue({
            isLoading: false,
            isError: false,
            data: {
                items: [
                    {
                        id: 11,
                        date: '2026-05-05',
                        time: '10:00',
                        service: { id: 1, name: 'Wizyta A' },
                        employee: { id: 2, name: 'Anna' },
                        status: 'scheduled',
                        price: 100,
                    },
                ],
            },
        });
        useCustomerNotesMock.mockReturnValue({
            isLoading: false,
            isError: false,
            data: [
                {
                    id: 12,
                    content: 'Ta sama data',
                    type: 'warning',
                    isPinned: false,
                    createdAt: '2026-05-05T10:00:00.000Z',
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
                            id: 13,
                            saleNumber: 'S-13',
                            soldAt: '2026-05-05T10:00:00.000Z',
                            totalGross: 150,
                        },
                    ],
                },
            },
        });

        render(<CustomerTimeline customerId={1} limit={10} />);

        const labels = screen.getAllByText(/Notatka|Sprzedaż|Wizyta/);
        expect(labels[0]).toHaveTextContent('Notatka');
        expect(labels[1]).toHaveTextContent('Sprzedaż');
        expect(labels[2]).toHaveTextContent('Wizyta');
    });

    it('does not link non-completed appointments to sales history', () => {
        useCustomerEventHistoryMock.mockReturnValue({
            isLoading: false,
            isError: false,
            data: {
                items: [
                    {
                        id: 501,
                        date: '2026-05-01',
                        time: '10:00',
                        service: { id: 1, name: 'Konsultacja' },
                        employee: { id: 2, name: 'Anna' },
                        status: 'scheduled',
                        price: 0,
                    },
                    {
                        id: 502,
                        date: '2026-05-01',
                        time: '09:00',
                        service: { id: 1, name: 'Koloryzacja' },
                        employee: { id: 2, name: 'Anna' },
                        status: 'completed',
                        price: 200,
                    },
                ],
            },
        });
        useCustomerNotesMock.mockReturnValue({
            isLoading: false,
            isError: false,
            data: [],
        });
        useCustomerLinkedSalesMock.mockReturnValue({
            linkedSalesQuery: {
                isLoading: false,
                isError: false,
                data: { items: [] },
            },
        });

        render(<CustomerTimeline customerId={1} limit={10} />);

        expect(
            screen.queryByRole('link', { name: 'Konsultacja' }),
        ).not.toBeInTheDocument();
        expect(
            screen.getByRole('link', { name: 'Koloryzacja' }),
        ).toHaveAttribute('href', '/sales/history?appointmentId=502');
    });
});
