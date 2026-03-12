import { fireEvent, render, screen } from '@testing-library/react';
import CustomerStatisticsTab from '@/components/customers/CustomerStatisticsTab';

jest.mock('@/hooks/useCustomers', () => ({
    useCustomerStatistics: jest.fn(() => ({
        isLoading: false,
        error: null,
        data: {
            totalVisits: 12,
            completedVisits: 10,
            cancelledVisits: 1,
            noShowVisits: 1,
            totalSpent: 600,
            serviceSpent: 450,
            productSpent: 150,
            averageSpent: 60,
            lastVisitDate: '2026-03-10T10:00:00.000Z',
            firstVisitDate: '2025-04-10T10:00:00.000Z',
            favoriteServices: [
                {
                    serviceId: 4,
                    serviceName: 'Strzyżenie',
                    count: 6,
                },
            ],
            favoriteEmployees: [
                {
                    employeeId: 3,
                    employeeName: 'Anna',
                    count: 6,
                },
            ],
            favoriteProducts: [
                {
                    productId: 8,
                    productName: 'Szampon',
                    count: 3,
                },
            ],
            visitsByMonth: [
                {
                    month: '2026-03',
                    count: 2,
                    spent: 200,
                    serviceSpent: 150,
                    productSpent: 50,
                },
            ],
        },
    })),
}));

describe('CustomerStatisticsTab', () => {
    it('renders real product totals and favorite products instead of hardcoded zeros', () => {
        render(<CustomerStatisticsTab customerId={7} />);

        expect(screen.getByText('450,00 zł')).toBeInTheDocument();
        expect(screen.getByText('150,00 zł')).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: /zakupione produkty 1/i }),
        ).toBeInTheDocument();

        fireEvent.click(
            screen.getByRole('button', { name: /zakupione produkty 1/i }),
        );

        expect(screen.getByText('Szampon')).toBeInTheDocument();
        expect(screen.getByText('zakupiono 3 szt.')).toBeInTheDocument();
        expect(
            screen.getByText('sprzedaż powiązana z wizytami'),
        ).toBeInTheDocument();
    });
});
