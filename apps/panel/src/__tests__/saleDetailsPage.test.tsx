import { render, screen } from '@testing-library/react';
import WarehouseSaleDetailsPage from '@/pages/sales/history/[id]';

const pushMock = jest.fn();
const useWarehouseSaleMock = jest.fn();

jest.mock('next/router', () => ({
    useRouter: () => ({
        query: { id: '55' },
        push: pushMock,
    }),
}));

jest.mock('@/components/warehouse/WarehouseLayout', () => ({
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
    ),
}));

jest.mock('@/hooks/useWarehouseViews', () => ({
    useWarehouseSale: (...args: unknown[]) => useWarehouseSaleMock(...args),
    useVoidWarehouseSale: () => ({ mutateAsync: jest.fn() }),
    useRefundWarehouseSale: () => ({ mutateAsync: jest.fn() }),
    useCorrectWarehouseSale: () => ({ mutateAsync: jest.fn() }),
}));

jest.mock('@/contexts/ToastContext', () => ({
    useToast: () => ({ success: jest.fn(), error: jest.fn() }),
}));

describe('WarehouseSaleDetailsPage', () => {
    beforeEach(() => {
        useWarehouseSaleMock.mockReset();
        useWarehouseSaleMock.mockReturnValue({
            isLoading: false,
            data: {
                id: 55,
                saleNumber: 'S20260500055',
                soldAt: '2026-05-01T10:00:00.000Z',
                clientName: 'Jan Kowalski',
                clientId: 123,
                appointmentId: 42,
                kind: 'sale',
                status: 'active',
                paymentMethod: 'card',
                discountGross: 0,
                totalNet: 80,
                totalGross: 100,
                items: [],
                createdAt: '2026-05-01T10:00:00.000Z',
                updatedAt: '2026-05-01T10:00:00.000Z',
            },
        });
    });

    it('links customer name and id to customer profile when clientId exists', () => {
        render(<WarehouseSaleDetailsPage />);

        const customerNameLink = screen.getByRole('link', {
            name: 'Jan Kowalski',
        });
        const customerIdLink = screen.getByRole('link', { name: '#123' });

        expect(customerNameLink).toHaveAttribute('href', '/customers/123');
        expect(customerIdLink).toHaveAttribute('href', '/customers/123');
    });
});
