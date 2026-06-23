import { fireEvent, render, screen } from '@testing-library/react';
import FinalizationModal from '@/components/calendar/FinalizationModal';

const apiFetchMock = jest.fn();
const mutateMock = jest.fn();
const invalidateMock = jest.fn();
const useQueryMock = jest.fn();

jest.mock('@/contexts/AuthContext', () => ({
    useAuth: () => ({ apiFetch: apiFetchMock }),
}));

jest.mock('@/components/Modal', () => ({
    __esModule: true,
    default: ({
        open,
        children,
    }: {
        open: boolean;
        children: React.ReactNode;
    }) => (open ? <div>{children}</div> : null),
}));

jest.mock('@tanstack/react-query', () => ({
    useQuery: (...args: unknown[]) => useQueryMock(...args),
    useMutation: jest.fn(() => ({
        mutate: mutateMock,
        isPending: false,
        isError: false,
    })),
    useQueryClient: jest.fn(() => ({
        invalidateQueries: invalidateMock,
    })),
}));

describe('FinalizationModal', () => {
    beforeEach(() => {
        apiFetchMock.mockReset();
        apiFetchMock.mockResolvedValue([]);
        mutateMock.mockReset();
        invalidateMock.mockReset();
        useQueryMock.mockReset();
        useQueryMock.mockReturnValue({ data: [] });
    });

    it('blocks finalization when discount exceeds service + products total', () => {
        render(
            <FinalizationModal
                open
                appointment={{
                    id: 7,
                    startTime: '2026-05-01T10:00:00.000Z',
                    status: 'in_progress',
                    service: {
                        id: 10,
                        name: 'Strzyżenie',
                        duration: 45,
                        price: 120,
                        priceType: 'fixed',
                        isActive: true,
                        onlineBooking: true,
                        sortOrder: 0,
                    },
                    client: { id: 5, name: 'Jan Kowalski' },
                }}
                onClose={jest.fn()}
            />,
        );

        fireEvent.change(document.querySelector('#fin-discount')!, {
            target: { value: '200' },
        });
        expect(
            screen.getByText(
                'Maksymalny rabat dla tej finalizacji to 120.00 PLN.',
            ),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: 'Zakończ wizytę' }),
        ).toBeDisabled();
        expect(mutateMock).not.toHaveBeenCalled();
    });

    it('submits finalize payload with cents values', () => {
        render(
            <FinalizationModal
                open
                appointment={{
                    id: 7,
                    startTime: '2026-05-01T10:00:00.000Z',
                    status: 'in_progress',
                    service: {
                        id: 10,
                        name: 'Strzyżenie',
                        duration: 45,
                        price: 120,
                        priceType: 'fixed',
                        isActive: true,
                        onlineBooking: true,
                        sortOrder: 0,
                    },
                    client: { id: 5, name: 'Jan Kowalski' },
                }}
                onClose={jest.fn()}
            />,
        );

        // Service price pre-fills from the appointment's price-list value (120).
        fireEvent.change(document.querySelector('#fin-discount')!, {
            target: { value: '10' },
        });
        fireEvent.change(document.querySelector('#fin-tip')!, {
            target: { value: '5' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Zakończ wizytę' }));

        expect(mutateMock).toHaveBeenCalledWith(
            expect.objectContaining({
                paymentMethod: 'card',
                servicePriceCents: 12000,
                paidAmountCents: 11500,
                tipAmountCents: 500,
                discountCents: 1000,
            }),
        );
    });

    it('blocks adding product quantity over stock', () => {
        useQueryMock.mockReturnValue({
            data: [
                {
                    id: 11,
                    name: 'Szampon',
                    unitPrice: 30,
                    stock: 1,
                    isActive: true,
                    trackStock: true,
                },
            ],
        });

        render(
            <FinalizationModal
                open
                appointment={{
                    id: 7,
                    startTime: '2026-05-01T10:00:00.000Z',
                    status: 'in_progress',
                    service: {
                        id: 10,
                        name: 'Strzyżenie',
                        duration: 45,
                        price: 120,
                        priceType: 'fixed',
                        isActive: true,
                        onlineBooking: true,
                        sortOrder: 0,
                    },
                    client: { id: 5, name: 'Jan Kowalski' },
                }}
                onClose={jest.fn()}
            />,
        );

        fireEvent.click(
            screen.getByRole('button', { name: '+ Dodaj produkt' }),
        );
        fireEvent.click(screen.getByRole('button', { name: /Szampon/ }));
        fireEvent.click(screen.getByRole('button', { name: '+' }));

        expect(
            screen.getByText('Maksymalna ilość dla Szampon to 1.'),
        ).toBeInTheDocument();
    });
});
